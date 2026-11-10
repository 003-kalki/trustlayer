import { NextResponse } from "next/server";
import { db, getDatabaseErrorMessage } from "@/lib/db";
import { getOnChainJob } from "@/lib/chain";
import { requireSession } from "@/lib/session";

const STATUS_TRANSITIONS = new Set([
  "PENDING_ACCEPTANCE",
  "FUNDED",
  "ACTIVE",
  "SUBMITTED_FOR_REVIEW",
  "COMPLETED",
  "DISPUTED",
  "ABANDONED_BY_FREELANCER",
  "ABANDONED_BY_EMPLOYER",
  "CANCELLED",
]);

// Which statuses each party may move a contract into, and from which current statuses.
const ROLE_TRANSITIONS = {
  EMPLOYER: {
    COMPLETED: ["ACTIVE", "SUBMITTED_FOR_REVIEW"],
    DISPUTED: ["ACTIVE", "SUBMITTED_FOR_REVIEW"],
    ABANDONED_BY_FREELANCER: ["PENDING_ACCEPTANCE", "FUNDED"],
  },
  FREELANCER: {
    ACTIVE: ["PENDING_ACCEPTANCE", "FUNDED"],
    CANCELLED: ["PENDING_ACCEPTANCE", "FUNDED"],
    SUBMITTED_FOR_REVIEW: ["ACTIVE"],
    ABANDONED_BY_FREELANCER: ["ACTIVE"],
    ABANDONED_BY_EMPLOYER: ["ACTIVE", "SUBMITTED_FOR_REVIEW"],
  },
};

let contractColumnsPromise;
let profileColumnsPromise;

async function getContractColumns() {
  if (!contractColumnsPromise) {
    contractColumnsPromise = db
      .query("SHOW COLUMNS FROM `contract`")
      .then(([rows]) => new Set(rows.map((row) => row.Field)));
  }

  return contractColumnsPromise;
}

async function getProfileColumns() {
  if (!profileColumnsPromise) {
    profileColumnsPromise = db
      .query("SHOW COLUMNS FROM `profile`")
      .then(([rows]) => new Set(rows.map((row) => row.Field)));
  }

  return profileColumnsPromise;
}

function mapContract(row, viewerWalletAddress) {
  const viewer = viewerWalletAddress?.toLowerCase();
  const isEmployer = viewer && row.employerWalletAddress === viewer;

  return {
    id: row.id,
    web3JobId: row.web3JobId,
    title: row.title,
    description: row.description,
    totalAmount: Number(row.totalAmount),
    milestoneAmount: Number(row.milestoneAmount),
    deadline: row.deadline,
    status: row.status,
    outcome: row.outcome,
    fundedAt: row.fundedAt,
    acceptedAt: row.acceptedAt,
    completedAt: row.completedAt,
    disputedAt: row.disputedAt,
    outcomeReportedBy: row.outcomeReportedBy,
    outcomeNote: row.outcomeNote,
    employerId: row.employerId,
    freelancerId: row.freelancerId,
    employerWalletAddress: row.employerWalletAddress,
    freelancerWalletAddress: row.freelancerWalletAddress,
    isEmployer: Boolean(isEmployer),
  };
}

async function fetchContractRecord(whereClause, params, viewerWalletAddress) {
  const [rows] = await db.query(
    `
      SELECT
        c.*,
        employer.walletAddress AS employerWalletAddress,
        freelancer.walletAddress AS freelancerWalletAddress
      FROM \`contract\` c
      INNER JOIN \`user\` employer ON employer.id = c.employerId
      LEFT JOIN \`user\` freelancer ON freelancer.id = c.freelancerId
      WHERE ${whereClause}
      LIMIT 1
    `,
    params
  );

  return rows[0] ? mapContract(rows[0], viewerWalletAddress) : null;
}

async function ensureUserWithProfile(walletAddress) {
  const normalizedWalletAddress = walletAddress.toLowerCase();
  const [existingUsers] = await db.query(
    "SELECT id FROM `user` WHERE walletAddress = ? LIMIT 1",
    [normalizedWalletAddress]
  );

  if (existingUsers[0]?.id) {
    return existingUsers[0].id;
  }

  const userId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const profileColumns = await getProfileColumns();

  await db.query(
    `
      INSERT INTO \`user\` (id, walletAddress, createdAt, updatedAt)
      VALUES (?, ?, NOW(), NOW())
    `,
    [userId, normalizedWalletAddress]
  );

  await db.query(
    `
      INSERT INTO \`profile\` (${[
        "id",
        "userId",
        profileColumns.has("role") ? "role" : null,
        profileColumns.has("privacyMode") ? "privacyMode" : null,
        "isFreelancer",
        "githubVerified",
        "upworkVerified",
      ]
        .filter(Boolean)
        .join(", ")})
      VALUES (${[
        "?",
        "?",
        profileColumns.has("role") ? "'BOTH'" : null,
        profileColumns.has("privacyMode") ? "'SELECTIVE'" : null,
        "1",
        "0",
        "0",
      ]
        .filter(Boolean)
        .join(", ")})
    `,
    [profileId, userId]
  );

  return userId;
}

export async function POST(req) {
  try {
    const session = requireSession(req);
    if (session.response) return session.response;

    const body = await req.json();
    const {
      web3JobId,
      title,
      description,
      milestoneAmount,
      deadline,
    } = body;

    if (!web3JobId || !/^\d+$/.test(web3JobId.toString())) {
      return NextResponse.json({ error: "Missing core transaction parameters" }, { status: 400 });
    }

    const normalizedWeb3JobId = web3JobId.toString();

    // Parties and amount come from the escrow contract, never from the request body.
    const chainJob = await getOnChainJob(normalizedWeb3JobId);
    if (!chainJob) {
      return NextResponse.json({ error: "That escrow job was not found on-chain yet. Please retry in a moment." }, { status: 409 });
    }

    const employerAddress = chainJob.employer;
    const freelancerAddress = chainJob.freelancer;
    const totalAmount = Number(chainJob.totalAmountMatic);
    const isEmployer = session.address === employerAddress;

    if (!isEmployer && session.address !== freelancerAddress) {
      return NextResponse.json({ error: "You are not a participant in this contract" }, { status: 403 });
    }

    const employerId = await ensureUserWithProfile(employerAddress);
    const freelancerId = await ensureUserWithProfile(freelancerAddress);
    const contractColumns = await getContractColumns();
    const [existingRows] = await db.query(
      "SELECT id FROM `contract` WHERE web3JobId = ? LIMIT 1",
      [normalizedWeb3JobId]
    );
    const existingContractId = existingRows[0]?.id;

    // Only the employer may rewrite agreement details on an existing record.
    if (existingContractId && !isEmployer) {
      const contract = await fetchContractRecord("c.id = ?", [existingContractId], session.address);
      return NextResponse.json({ contract }, { status: 200 });
    }

    if (existingContractId) {
      await db.query(
        `
          UPDATE \`contract\`
          SET
            title = ?,
            description = ?,
            milestoneAmount = ?,
            totalAmount = ?,
            deadline = ?,
            employerId = ?,
            freelancerId = ?,
            updatedAt = NOW()
          WHERE id = ?
        `,
        [
          title || "TrustLayer Escrow Agreement",
          description || "Escrow created through TrustLayer.",
          Number(milestoneAmount || totalAmount / 2),
          Number(totalAmount),
          deadline ? new Date(deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          employerId,
          freelancerId,
          existingContractId,
        ]
      );

      const contract = await fetchContractRecord("c.id = ?", [existingContractId], session.address);
      return NextResponse.json({ contract }, { status: 200 });
    }

    const contractId = crypto.randomUUID();
    const insertColumns = [
      "id",
      "title",
      "description",
      "milestoneAmount",
      "totalAmount",
      "deadline",
      "status",
      contractColumns.has("outcome") ? "outcome" : null,
      contractColumns.has("fundedAt") ? "fundedAt" : null,
      "employerId",
      "freelancerId",
      "createdAt",
      "updatedAt",
      "web3JobId",
    ].filter(Boolean);

    const insertValues = [
      "?",
      "?",
      "?",
      "?",
      "?",
      "?",
      "?",
      contractColumns.has("outcome") ? "NULL" : null,
      contractColumns.has("fundedAt") ? "NOW()" : null,
      "?",
      "?",
      "NOW()",
      "NOW()",
      "?",
    ].filter(Boolean);

    try {
      await db.query(
        `
          INSERT INTO \`contract\` (${insertColumns.join(", ")})
          VALUES (${insertValues.join(", ")})
        `,
        [
          contractId,
          title || "TrustLayer Escrow Agreement",
          description || "Escrow created through TrustLayer.",
          Number(milestoneAmount || totalAmount / 2),
          Number(totalAmount),
          deadline ? new Date(deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          contractColumns.has("fundedAt") ? "FUNDED" : "ACTIVE",
          employerId,
          freelancerId,
          normalizedWeb3JobId,
        ]
      );
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const existingContract = await fetchContractRecord("c.web3JobId = ?", [normalizedWeb3JobId], session.address);
        if (existingContract) {
          return NextResponse.json({ contract: existingContract }, { status: 200 });
        }
      }

      throw error;
    }

    const contract = await fetchContractRecord("c.id = ?", [contractId], session.address);
    return NextResponse.json({ contract }, { status: 200 });
  } catch (error) {
    console.error("Error committing contract metadata:", error);
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = requireSession(req);
    if (session.response) return session.response;

    // Contracts are private to their two parties, so listings are always scoped to the signed-in wallet.
    const { searchParams } = new URL(req.url);
    const jobIdsParam = searchParams.get("jobIds");
    const walletAddress = session.address;

    let rows = [];

    if (jobIdsParam) {
      const jobIds = jobIdsParam
        .split(",")
        .map((jobId) => jobId.trim())
        .filter(Boolean);

      if (jobIds.length === 0) {
        return NextResponse.json({ contracts: [] }, { status: 200 });
      }

      const placeholders = jobIds.map(() => "?").join(", ");
      const [result] = await db.query(
        `
          SELECT
            c.*,
            employer.walletAddress AS employerWalletAddress,
            freelancer.walletAddress AS freelancerWalletAddress
          FROM \`contract\` c
          INNER JOIN \`user\` employer ON employer.id = c.employerId
          LEFT JOIN \`user\` freelancer ON freelancer.id = c.freelancerId
          WHERE c.web3JobId IN (${placeholders})
            AND (employer.walletAddress = ? OR freelancer.walletAddress = ?)
          ORDER BY c.createdAt DESC
        `,
        [...jobIds, walletAddress, walletAddress]
      );
      rows = result;
    } else {
      const normalizedWalletAddress = walletAddress;
      const [result] = await db.query(
        `
          SELECT
            c.*,
            employer.walletAddress AS employerWalletAddress,
            freelancer.walletAddress AS freelancerWalletAddress
          FROM \`contract\` c
          INNER JOIN \`user\` employer ON employer.id = c.employerId
          LEFT JOIN \`user\` freelancer ON freelancer.id = c.freelancerId
          WHERE employer.walletAddress = ? OR freelancer.walletAddress = ?
          ORDER BY c.updatedAt DESC, c.createdAt DESC
        `,
        [normalizedWalletAddress, normalizedWalletAddress]
      );
      rows = result;
    }

    const contracts = rows.map((row) => mapContract(row, walletAddress));
    return NextResponse.json({ contracts }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving contract metadata:", error);
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = requireSession(req);
    if (session.response) return session.response;

    const body = await req.json();
    const { contractId, web3JobId, status, outcomeNote } = body;

    if ((!contractId && !web3JobId) || !status) {
      return NextResponse.json({ error: "contractId or web3JobId, and status are required" }, { status: 400 });
    }

    if (!STATUS_TRANSITIONS.has(status)) {
      return NextResponse.json({ error: "Unsupported status transition" }, { status: 400 });
    }

    const normalizedWalletAddress = session.address;
    const [rows] = await db.query(
      `
        SELECT
          c.id,
          c.status,
          c.employerId,
          c.freelancerId,
          employer.walletAddress AS employerWalletAddress,
          freelancer.walletAddress AS freelancerWalletAddress
        FROM \`contract\` c
        INNER JOIN \`user\` employer ON employer.id = c.employerId
        LEFT JOIN \`user\` freelancer ON freelancer.id = c.freelancerId
        WHERE ${contractId ? "c.id = ?" : "c.web3JobId = ?"}
        LIMIT 1
      `,
      [contractId || web3JobId.toString()]
    );

    const contract = rows[0];
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const isEmployer = contract.employerWalletAddress === normalizedWalletAddress;
    const isFreelancer = contract.freelancerWalletAddress === normalizedWalletAddress;

    if (!isEmployer && !isFreelancer) {
      return NextResponse.json({ error: "You are not a participant in this contract" }, { status: 403 });
    }

    const allowedFrom = ROLE_TRANSITIONS[isEmployer ? "EMPLOYER" : "FREELANCER"][status];
    if (!allowedFrom?.includes(contract.status)) {
      return NextResponse.json(
        { error: `The ${isEmployer ? "employer" : "freelancer"} cannot move a ${contract.status} contract to ${status}` },
        { status: 409 }
      );
    }

    const acceptedAt = status === "ACTIVE" ? new Date() : null;
    const completedAt = status === "COMPLETED" ? new Date() : null;
    const disputedAt = status === "DISPUTED" ? new Date() : null;
    const outcome = status.startsWith("ABANDONED") || status === "COMPLETED" || status === "CANCELLED" ? status : null;
    const contractColumns = await getContractColumns();
    const assignments = ["status = ?"];
    const values = [status];

    if (contractColumns.has("outcome")) {
      assignments.push("outcome = COALESCE(?, outcome)");
      values.push(outcome);
    }

    if (contractColumns.has("acceptedAt")) {
      assignments.push("acceptedAt = COALESCE(?, acceptedAt)");
      values.push(acceptedAt);
    }

    if (contractColumns.has("completedAt")) {
      assignments.push("completedAt = COALESCE(?, completedAt)");
      values.push(completedAt);
    }

    if (contractColumns.has("disputedAt")) {
      assignments.push("disputedAt = COALESCE(?, disputedAt)");
      values.push(disputedAt);
    }

    if (contractColumns.has("outcomeReportedBy")) {
      assignments.push("outcomeReportedBy = ?");
      values.push(isEmployer ? "EMPLOYER" : "FREELANCER");
    }

    if (contractColumns.has("outcomeNote")) {
      assignments.push("outcomeNote = ?");
      values.push(outcomeNote || null);
    }

    assignments.push("updatedAt = NOW()");
    values.push(contract.id);

    await db.query(
      `
        UPDATE \`contract\`
        SET
          ${assignments.join(",\n          ")}
        WHERE id = ?
      `,
      values
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating contract state:", error);
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 });
  }
}

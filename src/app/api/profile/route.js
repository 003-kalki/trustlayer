import { NextResponse } from "next/server";
import { db } from "@/lib/db";

let profileColumnsPromise;

async function getProfileColumns() {
  if (!profileColumnsPromise) {
    profileColumnsPromise = db
      .query("SHOW COLUMNS FROM `profile`")
      .then(([rows]) => new Set(rows.map((row) => row.Field)))
      .catch(() => new Set(["id", "userId", "handle", "bio", "isFreelancer", "githubVerified", "upworkVerified"]));
  }

  return profileColumnsPromise;
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.userId,
    walletAddress: row.walletAddress,
    createdAt: row.userCreatedAt,
    updatedAt: row.userUpdatedAt,
    profile: row.profileId
      ? {
          id: row.profileId,
          userId: row.userId,
          handle: row.handle,
          displayName: row.displayName,
          bio: row.bio,
          role: row.role || "BOTH",
          privacyMode: row.privacyMode || "SELECTIVE",
          isFreelancer: Boolean(row.isFreelancer),
          githubVerified: Boolean(row.githubVerified),
          upworkVerified: Boolean(row.upworkVerified),
        }
      : null,
    trustStats: {
      totalContracts: Number(row.totalContracts || 0),
      activeContracts: Number(row.activeContracts || 0),
      completedContracts: Number(row.completedContracts || 0),
      abandonedByUser: Number(row.abandonedByUser || 0),
      abandonedByCounterparty: Number(row.abandonedByCounterparty || 0),
      disputedContracts: Number(row.disputedContracts || 0),
    },
  };
}

async function fetchUser(walletAddress) {
  const columns = await getProfileColumns();
  const displayNameSelect = columns.has("displayName") ? "p.displayName" : "NULL AS displayName";
  const roleSelect = columns.has("role") ? "p.role" : "'BOTH' AS role";
  const privacyModeSelect = columns.has("privacyMode") ? "p.privacyMode" : "'SELECTIVE' AS privacyMode";

  const [rows] = await db.query(
    `
      SELECT
        u.id AS userId,
        u.walletAddress,
        u.createdAt AS userCreatedAt,
        u.updatedAt AS userUpdatedAt,
        p.id AS profileId,
        p.handle,
        ${displayNameSelect},
        p.bio,
        ${roleSelect},
        ${privacyModeSelect},
        p.isFreelancer,
        p.githubVerified,
        p.upworkVerified,
        COALESCE(contractStats.totalContracts, 0) AS totalContracts,
        COALESCE(contractStats.activeContracts, 0) AS activeContracts,
        COALESCE(contractStats.completedContracts, 0) AS completedContracts,
        COALESCE(contractStats.abandonedByUser, 0) AS abandonedByUser,
        COALESCE(contractStats.abandonedByCounterparty, 0) AS abandonedByCounterparty,
        COALESCE(contractStats.disputedContracts, 0) AS disputedContracts
      FROM \`user\` u
      LEFT JOIN \`profile\` p ON p.userId = u.id
      LEFT JOIN (
        SELECT
          participant.userId,
          COUNT(*) AS totalContracts,
          SUM(CASE WHEN c.status IN ('PENDING_ACCEPTANCE', 'FUNDED', 'ACTIVE', 'SUBMITTED_FOR_REVIEW') THEN 1 ELSE 0 END) AS activeContracts,
          SUM(CASE WHEN c.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedContracts,
          SUM(
            CASE
              WHEN (participant.relationship = 'EMPLOYER' AND c.status = 'ABANDONED_BY_EMPLOYER')
                OR (participant.relationship = 'FREELANCER' AND c.status = 'ABANDONED_BY_FREELANCER')
              THEN 1
              ELSE 0
            END
          ) AS abandonedByUser,
          SUM(
            CASE
              WHEN (participant.relationship = 'EMPLOYER' AND c.status = 'ABANDONED_BY_FREELANCER')
                OR (participant.relationship = 'FREELANCER' AND c.status = 'ABANDONED_BY_EMPLOYER')
              THEN 1
              ELSE 0
            END
          ) AS abandonedByCounterparty,
          SUM(CASE WHEN c.status = 'DISPUTED' THEN 1 ELSE 0 END) AS disputedContracts
        FROM (
          SELECT employerId AS userId, 'EMPLOYER' AS relationship, id AS contractId FROM \`contract\`
          UNION ALL
          SELECT freelancerId AS userId, 'FREELANCER' AS relationship, id AS contractId FROM \`contract\` WHERE freelancerId IS NOT NULL
        ) participant
        INNER JOIN \`contract\` c ON c.id = participant.contractId
        GROUP BY participant.userId
      ) contractStats ON contractStats.userId = u.id
      WHERE u.walletAddress = ?
      LIMIT 1
    `,
    [walletAddress]
  );

  return mapUser(rows[0]);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    const normalizedWalletAddress = walletAddress.toLowerCase();
    const userId = crypto.randomUUID();
    const profileId = crypto.randomUUID();

    await db.query(
      `
        INSERT INTO \`user\` (id, walletAddress, createdAt, updatedAt)
        VALUES (?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE updatedAt = NOW()
      `,
      [userId, normalizedWalletAddress]
    );

    const user = await fetchUser(normalizedWalletAddress);

    if (!user) {
      return NextResponse.json({ error: "User could not be loaded" }, { status: 500 });
    }

    await db.query(
      `
        INSERT INTO \`profile\` (id, userId, isFreelancer, githubVerified, upworkVerified)
        VALUES (?, ?, 1, 0, 0)
        ON DUPLICATE KEY UPDATE userId = userId
      `,
      [profileId, user.id]
    );

    const hydratedUser = await fetchUser(normalizedWalletAddress);
    return NextResponse.json({ user: hydratedUser }, { status: 200 });
  } catch (error) {
    console.error("Error in profile UPSERT API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    const user = await fetchUser(walletAddress.toLowerCase());

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error in profile GET API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { walletAddress, handle, displayName, bio, role, privacyMode } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    const normalizedWalletAddress = walletAddress.toLowerCase();
    const user = await fetchUser(normalizedWalletAddress);
    const columns = await getProfileColumns();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const assignments = [];
    const values = [];

    if (columns.has("handle")) {
      assignments.push("handle = ?");
      values.push(handle || null);
    }

    if (columns.has("displayName")) {
      assignments.push("displayName = ?");
      values.push(displayName || null);
    }

    if (columns.has("bio")) {
      assignments.push("bio = ?");
      values.push(bio || null);
    }

    if (columns.has("role")) {
      assignments.push("role = ?");
      values.push(role || "BOTH");
    }

    if (columns.has("privacyMode")) {
      assignments.push("privacyMode = ?");
      values.push(privacyMode || "SELECTIVE");
    }

    if (columns.has("isFreelancer")) {
      assignments.push("isFreelancer = ?");
      values.push((role || "BOTH") === "FREELANCER" || (role || "BOTH") === "BOTH" ? 1 : 0);
    }

    if (assignments.length === 0) {
      return NextResponse.json({ error: "No editable profile columns found" }, { status: 500 });
    }

    await db.query(
      `
        UPDATE \`profile\`
        SET
          ${assignments.join(",\n          ")}
        WHERE userId = ?
      `,
      [...values, user.id]
    );

    const updatedUser = await fetchUser(normalizedWalletAddress);
    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

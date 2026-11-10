import { NextResponse } from "next/server";
import { verifyProof } from "@reclaimprotocol/js-sdk";
import { db, getDatabaseErrorMessage } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function POST(req) {
  try {
    const session = requireSession(req);
    if (session.response) return session.response;

    const { type, proofs } = await req.json();

    const normalizedWalletAddress = session.address;
    const [userRows] = await db.query(
      "SELECT id FROM `user` WHERE walletAddress = ? LIMIT 1",
      [normalizedWalletAddress]
    );

    const user = userRows[0];

    if (!user) {
      return NextResponse.json({ error: "User identity block not found" }, { status: 404 });
    }

    if (type === "github") {
      if (!proofs) {
        return NextResponse.json({ error: "No proofs provided" }, { status: 400 });
      }

      const normalizedProofs = Array.isArray(proofs) ? proofs : [proofs];
      const isProofVerified = await verifyProof(normalizedProofs);

      if (!isProofVerified) {
        return NextResponse.json({ error: "Proof verification failed" }, { status: 400 });
      }

      await db.query(
        `
          INSERT INTO \`profile\` (id, userId, isFreelancer, githubVerified, upworkVerified)
          VALUES (?, ?, 0, 1, 0)
          ON DUPLICATE KEY UPDATE githubVerified = 1
        `,
        [crypto.randomUUID(), user.id]
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Credential verification storage error", error);
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 });
  }
}

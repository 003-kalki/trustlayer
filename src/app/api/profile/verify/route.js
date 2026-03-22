import { NextResponse } from "next/server";
import { verifyProof } from "@reclaimprotocol/js-sdk";
import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const { walletAddress, type, proofs } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    const normalizedWalletAddress = walletAddress.toLowerCase();
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
  } catch (e) {
    console.error("ZKP Storage Error", e);
    return NextResponse.json({ error: "Failed permanently storing verified credential" }, { status: 500 });
  }
}

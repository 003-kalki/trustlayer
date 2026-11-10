import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import { buildSignInMessage, endSession, getSessionAddress, readNonce, startSession } from "@/lib/session";

export async function GET(req) {
  try {
    return NextResponse.json({ address: getSessionAddress(req) }, { status: 200 });
  } catch (error) {
    console.error("Error reading session:", error);
    return NextResponse.json({ address: null }, { status: 200 });
  }
}

export async function POST(req) {
  try {
    const { signature } = await req.json();
    const nonce = readNonce(req);

    if (!nonce) {
      return NextResponse.json({ error: "Sign-in request expired. Please try again." }, { status: 401 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Signature is required" }, { status: 400 });
    }

    // Rebuild the exact message from the server-held nonce so the client can't swap in its own text.
    const message = buildSignInMessage(nonce.address, nonce.nonce, nonce.issuedAt);
    let recovered;
    try {
      recovered = verifyMessage(message, signature).toLowerCase();
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (recovered !== nonce.address) {
      return NextResponse.json({ error: "Signature does not match wallet address" }, { status: 401 });
    }

    const response = NextResponse.json({ address: recovered }, { status: 200 });
    startSession(response, recovered);
    return response;
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  endSession(response);
  return response;
}

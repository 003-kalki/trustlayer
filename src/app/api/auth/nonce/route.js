import { NextResponse } from "next/server";
import { isAddress } from "ethers";
import { nonceResponse } from "@/lib/session";

// Returns a one-time message for the wallet to sign before a session is issued.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "A valid wallet address is required" }, { status: 400 });
  }

  try {
    return nonceResponse(address);
  } catch (error) {
    console.error("Error issuing sign-in nonce:", error);
    return NextResponse.json({ error: "Sign-in is not configured on the server" }, { status: 500 });
  }
}

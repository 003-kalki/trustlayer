import crypto from "crypto";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "tl_session";
export const NONCE_COOKIE = "tl_nonce";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const NONCE_TTL_SECONDS = 5 * 60;

const globalForSession = globalThis;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is not configured");
  }

  // Local development only: a per-process secret, so sessions reset when the dev server restarts.
  if (!globalForSession.devSessionSecret) {
    globalForSession.devSessionSecret = crypto.randomBytes(32).toString("hex");
  }
  return globalForSession.devSessionSecret;
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verify(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest();
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function buildSignInMessage(address, nonce, issuedAt) {
  return [
    "Sign in to TrustLayer",
    "",
    "This proves you own this wallet. It does not send a transaction or cost gas.",
    "",
    `Address: ${address.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

// Responds with a one-time sign-in message; the nonce travels in a short-lived signed cookie.
export function nonceResponse(address) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const token = sign({ nonce, address: address.toLowerCase(), issuedAt, exp: Math.floor(Date.now() / 1000) + NONCE_TTL_SECONDS });
  const response = NextResponse.json({ message: buildSignInMessage(address, nonce, issuedAt) }, { status: 200 });
  response.cookies.set(NONCE_COOKIE, token, cookieOptions(NONCE_TTL_SECONDS));
  return response;
}

export function readNonce(req) {
  return verify(req.cookies.get(NONCE_COOKIE)?.value);
}

export function startSession(response, address) {
  const token = sign({ address: address.toLowerCase(), exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
  response.cookies.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));
  response.cookies.set(NONCE_COOKIE, "", cookieOptions(0));
}

export function endSession(response) {
  response.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
}

// Returns the signed-in wallet address (lowercase), or null.
export function getSessionAddress(req) {
  return verify(req.cookies.get(SESSION_COOKIE)?.value)?.address || null;
}

// Returns { address } for a signed-in request, or { response } holding a 401 to return as-is.
export function requireSession(req) {
  const address = getSessionAddress(req);
  if (!address) {
    return { response: NextResponse.json({ error: "Sign in with your wallet to continue" }, { status: 401 }) };
  }
  return { address };
}

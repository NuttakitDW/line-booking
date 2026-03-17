import { cookies } from "next/headers";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "som-admin-secret-change-me";
const COOKIE_NAME = "admin_token";

function base64url(buf: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buf instanceof ArrayBuffer ? buf : buf.buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const buf = Buffer.from(padded, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();

  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(
    enc.encode(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }))
  );
  const data = `${headerB64}.${payloadB64}`;

  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));

  return `${data}.${base64url(sig)}`;
}

export async function verifyJwt(
  token: string
): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  const key = await getKey();
  const enc = new TextEncoder();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64urlDecode(sigB64),
    enc.encode(data)
  );

  if (!valid) return null;

  const payload = JSON.parse(
    new TextDecoder().decode(base64urlDecode(payloadB64))
  );

  if (payload.exp && payload.exp < Date.now()) return null;

  return payload;
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return base64url(hash);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

export async function setAdminCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
}

export async function getAdminToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value;
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

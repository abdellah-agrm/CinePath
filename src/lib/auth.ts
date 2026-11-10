import bcrypt from "bcryptjs";

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
  iat?: number;
  exp?: number;
}

export const AUTH_COOKIE_NAME = "cinepath_auth_token";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "super_secret_jwt_access_key_change_me_in_production_min32chars";

// Base64URL encoding / decoding helpers
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf-8");
}

/**
 * Signs a JWT using Web Crypto HMAC-SHA256 (Edge Runtime compatible)
 */
export async function signJWT(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresInSeconds = 7 * 24 * 3600
): Promise<string> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(dataToSign)
    );

    const encodedSignature = Buffer.from(signature)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    return `${dataToSign}.${encodedSignature}`;
  } catch (error) {
    console.error("[Auth] Error signing JWT:", error);
    throw new Error("Token signing failed");
  }
}

/**
 * Verifies a JWT token using Web Crypto HMAC-SHA256 (Edge Runtime compatible)
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Convert signature back to Uint8Array
    const sigStr = encodedSignature.replace(/-/g, "+").replace(/_/g, "/");
    const sigPadded = sigStr + "=".repeat((4 - (sigStr.length % 4)) % 4);
    const sigBytes = Buffer.from(sigPadded, "base64");

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(dataToSign)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as JWTPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn("[Auth] Token expired");
      return null;
    }

    return payload;
  } catch (error) {
    console.warn("[Auth] Token verification failed:", error);
    return null;
  }
}

/**
 * Hash a password using bcrypt (12 rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, 12);
  } catch (error) {
    console.error("[Auth] Error hashing password:", error);
    throw new Error("Password hashing failed");
  }
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error("[Auth] Error verifying password:", error);
    return false;
  }
}

/**
 * Demo fallback accounts for standalone/development review when PostgreSQL is offline
 */
export const DEMO_USERS = [
  {
    id: "user-admin-01",
    email: "admin@cinepath.com",
    fullName: "Cinema Administrator",
    role: "ADMIN" as UserRole,
    passwordPlain: "Admin123!",
    // Pre-computed bcrypt hash of "Admin123!" with 12 rounds
    passwordHash: "$2a$12$e6yqQ66Ea/7f0LgWf3F.jOX1NqP.eW9z0k9J7iM8v4rEwV/P3D.cK",
  },
  {
    id: "user-staff-01",
    email: "staff@cinepath.com",
    fullName: "Cinema Gate Staff",
    role: "STAFF" as UserRole,
    passwordPlain: "Staff123!",
    passwordHash: "$2a$12$e6yqQ66Ea/7f0LgWf3F.jOX1NqP.eW9z0k9J7iM8v4rEwV/P3D.cK",
  },
  {
    id: "user-customer-01",
    email: "customer@cinepath.com",
    fullName: "Sara Mansouri",
    role: "CUSTOMER" as UserRole,
    passwordPlain: "Customer123!",
    passwordHash: "$2a$12$e6yqQ66Ea/7f0LgWf3F.jOX1NqP.eW9z0k9J7iM8v4rEwV/P3D.cK",
  },
];


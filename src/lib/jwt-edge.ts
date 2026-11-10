export interface JWTPayload {
  sub: string;
  email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  fullName: string;
  iat?: number;
  exp?: number;
}

export const AUTH_COOKIE_NAME = "cinepath_auth_token";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "super_secret_jwt_access_key_change_me_in_production_min32chars";

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  try {
    return atob(str);
  } catch {
    return Buffer.from(str, "base64").toString("utf-8");
  }
}

/**
 * Edge-compatible JWT verification using Web Crypto API
 */
export async function verifyJWTCrypto(token: string): Promise<JWTPayload | null> {
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

    // Decode signature
    const sigStr = encodedSignature.replace(/-/g, "+").replace(/_/g, "/");
    const sigPadded = sigStr + "=".repeat((4 - (sigStr.length % 4)) % 4);
    
    // Convert base64 to binary Uint8Array using atob
    const binarySig = atob(sigPadded);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

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
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}


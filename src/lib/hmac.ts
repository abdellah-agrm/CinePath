import crypto from "crypto";

const QR_SECRET =
  process.env.QR_SECRET || "cinepath_super_secret_hmac_key_min32chars";

/**
 * Generate an HMAC-SHA256 signature for a ticket payload
 * Payload format: `${ticketId}:${showtimeId}:${bookingRef}`
 */
export function generateTicketHmac(
  ticketId: string,
  showtimeId: string,
  bookingRef: string
): string {
  try {
    const data = `${ticketId}:${showtimeId}:${bookingRef}`;
    return crypto.createHmac("sha256", QR_SECRET).update(data).digest("hex");
  } catch (error) {
    console.error("[HMAC] Error generating signature:", error);
    return "";
  }
}

/**
 * Verify if the provided HMAC matches the ticket payload
 */
export function verifyTicketHmac(
  ticketId: string,
  showtimeId: string,
  bookingRef: string,
  providedHmac: string
): boolean {
  try {
    if (!ticketId || !showtimeId || !bookingRef || !providedHmac) return false;
    const expectedHmac = generateTicketHmac(ticketId, showtimeId, bookingRef);
    if (!expectedHmac) return false;

    return crypto.timingSafeEqual(
      Buffer.from(expectedHmac, "hex"),
      Buffer.from(providedHmac, "hex")
    );
  } catch (error) {
    console.warn("[HMAC] Signature verification rejected:", error);
    return false;
  }
}

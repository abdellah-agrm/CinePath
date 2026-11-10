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
  const data = `${ticketId}:${showtimeId}:${bookingRef}`;
  return crypto.createHmac("sha256", QR_SECRET).update(data).digest("hex");
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
  const expectedHmac = generateTicketHmac(ticketId, showtimeId, bookingRef);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHmac, "hex"),
      Buffer.from(providedHmac, "hex")
    );
  } catch {
    return false;
  }
}


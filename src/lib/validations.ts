import { z } from "zod";

export const lockSeatsSchema = z.object({
  seatIds: z
    .array(z.string().min(1))
    .min(1, "Select at least 1 seat")
    .max(8, "Maximum 8 seats per booking"),
  lockToken: z.string().min(6, "Invalid lock token"),
});

export const createBookingSchema = z.object({
  showtimeId: z.string().min(1),
  lockToken: z.string().min(6),
  guestEmail: z.string().email("Please provide a valid email address").optional(),
  promoCode: z.string().optional(),
  seats: z
    .array(
      z.object({
        seatId: z.string().min(1),
        ticketType: z.enum(["NORMAL", "STUDENT", "SENIOR"]),
      })
    )
    .min(1)
    .max(8),
});

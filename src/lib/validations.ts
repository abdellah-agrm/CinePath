import { z } from "zod";

export const lockSeatsSchema = z.object({
  seatIds: z.array(z.string().uuid()).min(1, "Select at least 1 seat").max(8, "Maximum 8 seats per booking"),
  lockToken: z.string().min(10, "Invalid lock token"),
});

export const createBookingSchema = z.object({
  showtimeId: z.string().uuid(),
  lockToken: z.string().min(10),
  guestEmail: z.string().email("Please provide a valid email address").optional(),
  promoCode: z.string().optional(),
  seats: z.array(
    z.object({
      seatId: z.string().uuid(),
      ticketType: z.enum(["NORMAL", "STUDENT", "SENIOR"]),
    })
  ).min(1).max(8),
});


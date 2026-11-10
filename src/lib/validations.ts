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

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

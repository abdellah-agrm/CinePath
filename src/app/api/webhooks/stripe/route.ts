import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { generateTicketHmac } from "@/lib/hmac";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In development / demo mode without webhook secret set
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle successful payment
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.bookingId;

    if (!bookingId) {
      console.warn("PaymentIntent missing bookingId metadata");
      return NextResponse.json({ received: true });
    }

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          showtime: true,
          tickets: true,
        },
      });

      if (!booking) {
        console.warn(`Booking ${bookingId} not found, acknowledging webhook.`);
        return NextResponse.json({ received: true, warning: "Booking not found" });
      }

      // 1. Check if the booking was already confirmed
      if (booking.status === "CONFIRMED") {
        return NextResponse.json({ received: true, status: "ALREADY_CONFIRMED" });
      }

      // 2. Check for Seat Race Condition / Expiration
      // Check if any seat was booked by another customer in the meantime
      const seatIds = booking.tickets.map((t) => t.seatId);
      const conflictingTickets = await prisma.ticket.findMany({
        where: {
          showtimeId: booking.showtimeId,
          seatId: { in: seatIds },
          bookingId: { not: booking.id },
          status: { in: ["ACTIVE", "USED"] },
        },
      });

      // LATE WEBHOOK RACE CONDITION: Seats were taken after lock expiry
      if (conflictingTickets.length > 0) {
        console.warn(
          `⚠️ Late webhook race condition on booking ${booking.id}! Initiating automatic Stripe refund.`
        );

        // Trigger automatic refund via Stripe
        if (paymentIntent.id && !paymentIntent.id.startsWith("demo_")) {
          await stripe.refunds.create({
            payment_intent: paymentIntent.id,
            reason: "duplicate",
          });
        }

        // Update booking as REFUNDED
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "REFUNDED" },
        });

        return NextResponse.json({
          received: true,
          action: "AUTO_REFUNDED_DUE_TO_COLLISION",
        });
      }

      // 3. Confirm booking & generate HMAC signed tokens for tickets
      await prisma.$transaction(async (tx) => {
        // Update booking status
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED" },
        });

        // Update each ticket with its cryptographic HMAC payload
        for (const ticket of booking.tickets) {
          const qrPayload = `${ticket.id}:${booking.showtimeId}:${booking.reference}:${generateTicketHmac(
            ticket.id,
            booking.showtimeId,
            booking.reference
          )}`;

          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "ACTIVE",
              qrPayload,
            },
          });
        }

        // Record payment success
        await tx.payment.upsert({
          where: { bookingId: booking.id },
          create: {
            bookingId: booking.id,
            providerRef: paymentIntent.id,
            amount: booking.totalAmount,
            currency: "MAD",
            status: "SUCCEEDED",
            paidAt: new Date(),
          },
          update: {
            status: "SUCCEEDED",
            paidAt: new Date(),
          },
        });
      });

      // 4. Release Redis temporary locks
      const pipeline = redis.pipeline();
      for (const seatId of seatIds) {
        pipeline.del(`lock:${booking.showtimeId}:${seatId}`);
      }
      await pipeline.exec();

      console.log(`✅ Booking ${booking.reference} confirmed successfully!`);

      return NextResponse.json({ received: true, action: "CONFIRMED" });
    } catch (error) {
      console.error("Failed to process payment webhook:", error);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}


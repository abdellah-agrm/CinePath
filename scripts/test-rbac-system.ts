import { prisma } from "../src/lib/prisma";
import { signJWT } from "../src/lib/auth";
import { generateTicketHmac } from "../src/lib/hmac";
import crypto from "crypto";

async function runTests() {
  console.log("=== STARTING FULL RBAC & AUDIT LOGGING VERIFICATION ===");

  // 1. Setup Admin, Staff, and Customer users in PostgreSQL
  console.log("\n[1] Ensuring Admin, Staff, and Customer users exist in database...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@cinepath.system" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@cinepath.system",
      fullName: "Super Admin",
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
      role: "ADMIN",
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@cinepath.system" },
    update: { role: "STAFF" },
    create: {
      email: "staff@cinepath.system",
      fullName: "Gate Staff Agent",
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
      role: "STAFF",
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@test.com" },
    update: { role: "CUSTOMER" },
    create: {
      email: "customer@test.com",
      fullName: "Cinema Fan",
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
      role: "CUSTOMER",
    },
  });

  const adminToken = await signJWT({
    sub: adminUser.id,
    email: adminUser.email,
    role: "ADMIN",
    fullName: adminUser.fullName,
  });

  const staffToken = await signJWT({
    sub: staffUser.id,
    email: staffUser.email,
    role: "STAFF",
    fullName: staffUser.fullName,
  });

  const customerToken = await signJWT({
    sub: customerUser.id,
    email: customerUser.email,
    role: "CUSTOMER",
    fullName: customerUser.fullName,
  });

  console.log("✅ Users configured & JWT tokens signed.");

  const BASE_URL = "http://localhost:3000";

  // Helper fetch with cookie
  const authFetch = (url: string, token: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Cookie: `cinepath_auth_token=${token}`,
        "Content-Type": "application/json",
      },
    });
  };

  // 2. Admin Movie Management
  console.log("\n[2] Testing Admin Movie CRUD (/api/admin/movies)...");
  const movieRes = await authFetch(`${BASE_URL}/api/admin/movies`, adminToken, {
    method: "POST",
    body: JSON.stringify({
      title: "Avatar: Fire and Ash",
      synopsis: "The Na'vi journey across unexplored volcanic territories.",
      durationMin: 190,
      ageRating: "12+",
      originalLanguage: "en",
      posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      status: "NOW_SHOWING",
    }),
  });
  const movieData = await movieRes.json();
  console.log("Movie create result:", movieData.success ? `Created "${movieData.data?.title}" (ID: ${movieData.data?.id})` : movieData);
  const movieId = movieData.data?.id;

  // 3. Admin Hall & Seat Layout Management
  console.log("\n[3] Testing Admin Hall & Seat Layout (/api/admin/halls)...");
  const hallsRes = await authFetch(`${BASE_URL}/api/admin/halls`, adminToken);
  const hallsData = await hallsRes.json();
  const targetCinema = hallsData.data?.[0];
  const targetHall = targetCinema?.halls?.[0];
  console.log(`Found hall: "${targetHall?.name}" in "${targetCinema?.name}" with ${targetHall?.stats?.total} seats`);

  // Get seats for hall
  const hallSeatsRes = await authFetch(`${BASE_URL}/api/admin/halls/${targetHall.id}/seats`, adminToken);
  const hallSeatsData = await hallSeatsRes.json();
  const seats = hallSeatsData.data?.seats || [];
  const testBrokenSeat = seats[0]; // e.g. A1
  const testValidSeat = seats[1]; // e.g. A2
  console.log(`Setting seat ${testBrokenSeat.rowLabel}${testBrokenSeat.seatNumber} to BROKEN (Maintenance)...`);

  const updateSeatsRes = await authFetch(`${BASE_URL}/api/admin/halls/${targetHall.id}/seats`, adminToken, {
    method: "PUT",
    body: JSON.stringify({
      seats: [
        { id: testBrokenSeat.id, type: testBrokenSeat.type, status: "BROKEN", priceModifier: 0 },
        { id: testValidSeat.id, type: "VIP", status: "USABLE", priceModifier: 30 },
      ],
    }),
  });
  const updateSeatsData = await updateSeatsRes.json();
  console.log("Seats update response:", updateSeatsData.message);

  // 4. Admin Showtime Scheduling
  console.log("\n[4] Testing Admin Showtime Scheduling (/api/admin/showtimes)...");
  const startTime = new Date(Date.now() + 3600 * 1000 * 24).toISOString();
  const showtimeRes = await authFetch(`${BASE_URL}/api/admin/showtimes`, adminToken, {
    method: "POST",
    body: JSON.stringify({
      movieId,
      hallId: targetHall.id,
      startTime,
      basePrice: 95.0,
      format: "IMAX_2D",
      audioLanguage: "VOSTFR",
    }),
  });
  const showtimeData = await showtimeRes.json();
  console.log("Showtime creation result:", showtimeData.success ? `Scheduled Showtime ID: ${showtimeData.data?.id}` : showtimeData);
  const showtimeId = showtimeData.data?.id;

  // 5. Customer Seat Selection Guard: Attempt to Lock Broken Seat
  console.log("\n[5] Testing Customer Broken Seat Guard (/api/showtimes/[id]/lock-seats)...");
  const brokenSeatLabel = `${testBrokenSeat.rowLabel}${testBrokenSeat.seatNumber}`;
  const lockBrokenRes = await authFetch(`${BASE_URL}/api/showtimes/${showtimeId}/lock-seats`, customerToken, {
    method: "POST",
    body: JSON.stringify({
      seatIds: [brokenSeatLabel],
      lockToken: "cust-lock-token-12345",
    }),
  });
  const lockBrokenData = await lockBrokenRes.json();
  console.log("Locking broken seat response status:", lockBrokenRes.status, lockBrokenData);
  if (lockBrokenRes.status === 409 && lockBrokenData.code === "SEAT_UNAVAILABLE") {
    console.log("✅ Broken seat protection verified! Customer was blocked from booking broken seat.");
  } else {
    console.error("❌ Broken seat protection failed!");
  }

  // 6. Customer Books Valid Seat
  console.log("\n[6] Testing Customer Booking on Valid Seat (/api/bookings)...");
  const validSeatLabel = `${testValidSeat.rowLabel}${testValidSeat.seatNumber}`;
  const lockValidRes = await authFetch(`${BASE_URL}/api/showtimes/${showtimeId}/lock-seats`, customerToken, {
    method: "POST",
    body: JSON.stringify({
      seatIds: [validSeatLabel],
      lockToken: "cust-lock-token-67890",
    }),
  });
  const lockValidData = await lockValidRes.json();
  console.log("Valid seat lock response:", lockValidData.success);

  const bookRes = await authFetch(`${BASE_URL}/api/bookings`, customerToken, {
    method: "POST",
    body: JSON.stringify({
      showtimeId,
      seats: [validSeatLabel],
      lockToken: "cust-lock-token-67890",
      customerEmail: "customer@test.com",
      customerName: "Cinema Fan",
      totalAmount: 125.0,
    }),
  });
  const bookData = await bookRes.json();
  console.log("Booking response:", bookData.success ? `Booked Ref #${bookData.booking?.reference}` : bookData);
  const bookingRef = bookData.booking?.reference;
  const ticketId = bookData.booking?.tickets?.[0]?.id;
  const hmac = generateTicketHmac(ticketId, showtimeId, bookingRef);

  // 7. Gate Turnstile Validation - Valid Scan
  console.log("\n[7] Testing Turnstile QR Scan - Valid Ticket (/api/tickets/validate)...");
  const scanValidRes = await authFetch(`${BASE_URL}/api/tickets/validate`, staffToken, {
    method: "POST",
    body: JSON.stringify({
      qrData: JSON.stringify({
        ref: bookingRef,
        ticketId,
        showtimeId,
        hmac,
      }),
    }),
  });
  const scanValidData = await scanValidRes.json();
  console.log("Scan 1 result:", scanValidData.code, scanValidData.message);
  if (scanValidData.code === "VALID") {
    console.log("✅ Turnstile entry permitted!");
  }

  // 8. Gate Turnstile Validation - Duplicate Scan Anomaly Detection (WARN)
  console.log("\n[8] Testing Turnstile Duplicate Scan Anomaly Detection (/api/tickets/validate)...");
  const scanDupRes = await authFetch(`${BASE_URL}/api/tickets/validate`, staffToken, {
    method: "POST",
    body: JSON.stringify({
      qrData: JSON.stringify({
        ref: bookingRef,
        ticketId,
        showtimeId,
        hmac,
      }),
    }),
  });
  const scanDupData = await scanDupRes.json();
  console.log("Scan 2 (duplicate) result:", scanDupRes.status, scanDupData.code, scanDupData.message);
  if (scanDupData.code === "ALREADY_USED") {
    console.log("✅ Duplicate gate scan intercepted & denied!");
  }

  // 9. Gate Turnstile Validation - Tampered / Forged HMAC QR (CRITICAL)
  console.log("\n[9] Testing Turnstile Tampered / Forged HMAC Detection (/api/tickets/validate)...");
  const scanForgedRes = await authFetch(`${BASE_URL}/api/tickets/validate`, staffToken, {
    method: "POST",
    body: JSON.stringify({
      qrData: JSON.stringify({
        ref: bookingRef,
        ticketId,
        showtimeId,
        hmac: "forged_invalid_signature_hex_12345678",
      }),
    }),
  });
  const scanForgedData = await scanForgedRes.json();
  console.log("Scan 3 (forged) result:", scanForgedRes.status, scanForgedData.code, scanForgedData.message);
  if (scanForgedData.code === "FORGED_QR") {
    console.log("✅ Forged QR code intercepted & flagged as CRITICAL!");
  }

  // 10. Staff Ticket Management - Reset Status to ACTIVE
  console.log("\n[10] Testing Staff Manual Ticket Status Override (/api/staff/tickets)...");
  const staffResetRes = await authFetch(`${BASE_URL}/api/staff/tickets`, staffToken, {
    method: "PATCH",
    body: JSON.stringify({
      ticketId,
      newStatus: "ACTIVE",
      reason: "Accidental gate double scan - customer permitted reentry",
    }),
  });
  const staffResetData = await staffResetRes.json();
  console.log("Staff reset response:", staffResetData.success, staffResetData.message);

  // Verify re-admission works after staff reset
  const reScanRes = await authFetch(`${BASE_URL}/api/tickets/validate`, staffToken, {
    method: "POST",
    body: JSON.stringify({
      qrData: JSON.stringify({
        ref: bookingRef,
        ticketId,
        showtimeId,
        hmac,
      }),
    }),
  });
  const reScanData = await reScanRes.json();
  console.log("Re-scan after staff reset:", reScanData.code, reScanData.message);
  if (reScanData.code === "VALID") {
    console.log("✅ Staff override worked! Ticket re-admitted successfully.");
  }

  // 11. Admin Security & Audit Trail Verification
  console.log("\n[11] Testing Admin Security & Audit Logs (/api/admin/logs)...");
  const logsRes = await authFetch(`${BASE_URL}/api/admin/logs`, adminToken);
  const logsData = await logsRes.json();
  console.log(`Audit Logs Summary: ${logsData.summary?.critical} Critical, ${logsData.summary?.warn} Warnings, ${logsData.summary?.info} Info (Total: ${logsData.total})`);

  console.log("\nRecent Log Entries Recorded in PostgreSQL:");
  logsData.data?.slice(0, 8).forEach((log: any) => {
    console.log(` [${log.severity}] ${log.action} (${log.entityType}): ${log.message}`);
  });

  console.log("\n=== RBAC & AUDIT LOGGING VERIFICATION COMPLETE ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

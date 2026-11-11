async function testEndToEnd() {
  const showtimeId = "session-la-legende-de-derry-2";
  const lockToken = "test_user_tok_" + Date.now();

  const testSeats = ["C3", "C4"];
  console.log(`1. Locking seats ${testSeats.join(" & ")} via HTTP /api/showtimes/[id]/lock-seats ...`);
  const lockRes = await fetch(`http://127.0.0.1:3000/api/showtimes/${showtimeId}/lock-seats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seatIds: testSeats,
      lockToken,
    }),
  });
  const lockData = await lockRes.json();
  console.log("Lock result:", lockData);
  if (!lockRes.ok || !lockData.success) throw new Error("Seat lock failed");

  console.log("2. Booking seats via HTTP /api/bookings ...");
  const bookRes = await fetch("http://127.0.0.1:3000/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      showtimeId,
      seats: testSeats,
      lockToken,
      customerEmail: "guest.customer@example.com",
      customerName: "Guest Moviegoer",
      totalAmount: 220,
    }),
  });
  const bookData = await bookRes.json();
  console.log("Booking result:", bookData);
  if (!bookRes.ok || !bookData.success) throw new Error("Booking failed");

  const booking = bookData.booking;
  console.log(`✅ BOOKING CREATED: #${booking.reference} for ${booking.movieTitle} at ${booking.cinema}`);

  console.log("3. Verifying gate turnstile validation via HTTP /api/tickets/validate ...");
  const crypto = require("crypto");
  const QR_SECRET = process.env.QR_SECRET || "cinepath_super_secret_hmac_key_min32chars";
  const ticketSig = crypto
    .createHmac("sha256", QR_SECRET)
    .update(`${booking.id}:showtime-active:${booking.reference}`)
    .digest("hex");

  const scanPayload = JSON.stringify({
    ref: booking.reference,
    movie: booking.movieTitle,
    hall: booking.hall,
    time: booking.time,
    seats: booking.seatLabels,
    sig: ticketSig,
  });

  const scanRes = await fetch("http://127.0.0.1:3000/api/tickets/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: scanPayload,
      turnstileId: "GATE-ANFA-IMAX-01",
    }),
  });
  const scanData = await scanRes.json();
  console.log("Turnstile scan result:", scanData);
  if (!scanRes.ok || scanData.code !== "VALID") throw new Error("Turnstile validation failed");

  console.log("4. Testing turnstile anti-passback (double scan rejection) ...");
  const scan2Res = await fetch("http://127.0.0.1:3000/api/tickets/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: scanPayload,
      turnstileId: "GATE-ANFA-IMAX-01",
    }),
  });
  const scan2Data = await scan2Res.json();
  console.log("Turnstile scan 2 result:", scan2Data);
  if (scan2Data.code !== "ALREADY_USED") throw new Error("Double scan should be rejected");

  console.log("🎉 ALL TESTS PASSED! Full system working through HTTP backend on port 3000!");
}

testEndToEnd().catch((e) => {
  console.error("❌ E2E TEST FAILED:", e);
  process.exit(1);
});

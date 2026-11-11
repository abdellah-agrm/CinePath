/**
 * CinePath Comprehensive Backend API Test Suite
 * Tests all REST endpoints live against the running server:
 * Catalog, Seat Locking, Tickets, Webhooks, and Authentication (RBAC).
 */

const BASE_URL = "http://localhost:3000";

let authCookie = "";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const start = Date.now();
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(authCookie ? { Cookie: authCookie } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });
    const duration = Date.now() - start;

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      // Extract first cookie segment
      authCookie = setCookie.split(";")[0];
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return {
      status: res.status,
      ok: res.ok,
      duration,
      data,
      setCookie,
    };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      duration: Date.now() - start,
      error: err.message,
    };
  }
}

async function runTestSuite() {
  console.log("===============================================================");
  console.log("🎬  CinePath Backend API Live Automated Test Suite");
  console.log(`📡  Target: ${BASE_URL}`);
  console.log("===============================================================\n");

  const results = [];

  // TEST 1: Healthcheck
  {
    process.stdout.write("1. Testing GET /api/health ... ");
    const res = await request("/api/health");
    const passed = res.status === 200 || res.status === 503;
    results.push({ name: "GET /api/health", passed, ...res });
    console.log(passed ? `✅ PASS (${res.status} in ${res.duration}ms)` : `❌ FAIL (${res.status})`);
  }

  // TEST 2: Movie Catalog (All)
  {
    process.stdout.write("2. Testing GET /api/movies ... ");
    const res = await request("/api/movies");
    const passed = res.status === 200 && res.data?.success && Array.isArray(res.data?.data);
    results.push({ name: "GET /api/movies", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Returned ${res.data.count} movies in ${res.duration}ms)`
        : `❌ FAIL (${res.status})`
    );
  }

  // TEST 3: Movie Catalog Filtered by Genre
  {
    process.stdout.write("3. Testing GET /api/movies?genre=Action ... ");
    const res = await request("/api/movies?genre=Action");
    const passed = res.status === 200 && res.data?.success;
    results.push({ name: "GET /api/movies?genre=Action", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Filtered ${res.data.count} movies in ${res.duration}ms)`
        : `❌ FAIL (${res.status})`
    );
  }

  // TEST 4: Movie Details by Slug
  {
    process.stdout.write("4. Testing GET /api/movies/dune-part-two ... ");
    const res = await request("/api/movies/dune-part-two");
    const passed = res.status === 200 && res.data?.success && res.data?.data?.title;
    results.push({ name: "GET /api/movies/[slug]", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Loaded "${res.data.data.title}" in ${res.duration}ms)`
        : `❌ FAIL (${res.status})`
    );
  }

  // TEST 5: Showtime Seat Grid Layout
  {
    process.stdout.write("5. Testing GET /api/showtimes/demo-showtime/seats ... ");
    const res = await request("/api/showtimes/demo-showtime/seats");
    const passed = res.status === 200 && res.data?.success && res.data?.data?.seats?.length > 0;
    results.push({ name: "GET /api/showtimes/[id]/seats", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Loaded ${res.data.data.seats.length} seats in ${res.duration}ms)`
        : `❌ FAIL (${res.status})`
    );
  }

  // TEST 6: Atomic Seat Locking
  {
    process.stdout.write("6. Testing POST /api/showtimes/demo-showtime/lock-seats ... ");
    const lockToken = `test_token_${Date.now()}`;
    const randNum = Math.floor(Math.random() * 80) + 1;
    const res = await request("/api/showtimes/demo-showtime/lock-seats", {
      method: "POST",
      body: JSON.stringify({
        seatIds: [`seat-R${randNum}-1`, `seat-R${randNum}-2`],
        lockToken,
      }),
    });
    const passed = res.status === 200 && res.data?.success && res.data?.data?.expiresAt;
    results.push({ name: "POST /api/showtimes/[id]/lock-seats", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Locked with TTL in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.message || res.error})`
    );
  }

  // TEST 7: Staff Ticket QR Code Validation
  {
    process.stdout.write("7. Testing POST /api/tickets/validate ... ");
    const res = await request("/api/tickets/validate", {
      method: "POST",
      body: JSON.stringify({
        qrData: {
          ref: "CP-48213",
        },
      }),
    });
    const passed = res.status === 200 && res.data?.code === "VALID";
    results.push({ name: "POST /api/tickets/validate", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Admission Status: "${res.data.message}" in ${res.duration}ms)`
        : `❌ FAIL (${res.status})`
    );
  }

  // TEST 8: Stripe Webhook Processing
  {
    process.stdout.write("8. Testing POST /api/webhooks/stripe ... ");
    const res = await request("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_demo_test_12345",
            metadata: { bookingId: "demo-booking-uuid" },
          },
        },
      }),
    });
    const passed = res.status === 200 && res.data?.received;
    results.push({ name: "POST /api/webhooks/stripe", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Webhook Acknowledged in ${res.duration}ms)`
        : `❌ FAIL (${res.status})`
    );
  }

  // TEST 9: Auth Registration (New Customer)
  {
    process.stdout.write("9. Testing POST /api/auth/register ... ");
    const testEmail = `test_customer_${Date.now()}@cinepath.com`;
    const res = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Test Automated Customer",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const passed = res.status === 200 && res.data?.success && res.data?.user?.role === "CUSTOMER";
    results.push({ name: "POST /api/auth/register", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Registered user "${res.data.user.email}" with role ${res.data.user.role} in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.error || res.error})`
    );
  }

  // TEST 10: Auth Login (Admin Role)
  {
    process.stdout.write("10. Testing POST /api/auth/login (Admin) ... ");
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@cinepath.com",
        password: "Admin123!",
      }),
    });
    const passed = res.status === 200 && res.data?.success && res.data?.user?.role === "ADMIN";
    results.push({ name: "POST /api/auth/login", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Authenticated as "${res.data.user.fullName}" (${res.data.user.role}) in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.error || res.error})`
    );
  }

  // TEST 11: Auth Session Check (GET /api/auth/me)
  {
    process.stdout.write("11. Testing GET /api/auth/me ... ");
    const res = await request("/api/auth/me");
    const passed = res.status === 200 && res.data?.authenticated && res.data?.user?.role === "ADMIN";
    results.push({ name: "GET /api/auth/me", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Verified session for ${res.data.user.email} (${res.data.user.role}) in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.error || res.error})`
    );
  }

  // TEST 12: Admin User Management (GET /api/admin/users)
  {
    process.stdout.write("12. Testing GET /api/admin/users (RBAC Guard) ... ");
    const res = await request("/api/admin/users");
    const passed = res.status === 200 && res.data?.success && Array.isArray(res.data?.data);
    results.push({ name: "GET /api/admin/users", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Returned ${res.data.data.length} registered accounts in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.error || res.error})`
    );
  }

  // TEST 13: Create Real Database Booking (POST /api/bookings)
  let createdBookingRef = "";
  let createdTicketQr = "";
  {
    process.stdout.write("13. Testing POST /api/bookings (Real PostgreSQL & Redis) ... ");
    const lockToken = "test_lock_" + Date.now();
    const res = await request("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        showtimeId: "showtime-gladiator-ii-2",
        seats: ["A1", "A2"],
        lockToken,
        customerEmail: "qa_booking@cinepath.com",
        customerName: "Alex Morgan",
        totalAmount: 220,
      }),
    });
    const passed = res.status === 200 && res.data?.success && Boolean(res.data?.booking?.reference);
    if (passed) {
      createdBookingRef = res.data.booking.reference;
    }
    results.push({ name: "POST /api/bookings", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Created Real DB Booking "${createdBookingRef}" with 2 seats in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.message || res.error})`
    );
  }

  // TEST 14: Query Real Database Booking (GET /api/bookings/[id])
  {
    process.stdout.write("14. Testing GET /api/bookings/[id] ... ");
    const res = await request(`/api/bookings/${createdBookingRef}`);
    const passed = res.status === 200 && res.data?.success && res.data?.booking?.reference === createdBookingRef;
    results.push({ name: "GET /api/bookings/[id]", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Retrieved DB Booking for "${res.data.booking.movieTitle}" in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.message || res.error})`
    );
  }

  // TEST 15: Validate Real Database Booking at Turnstile (POST /api/tickets/validate)
  {
    process.stdout.write("15. Testing POST /api/tickets/validate (Real Database Verification) ... ");
    const res = await request("/api/tickets/validate", {
      method: "POST",
      body: JSON.stringify({
        qrData: JSON.stringify({
          ref: createdBookingRef,
          ticketId: "real-db-ticket",
          showtimeId: "showtime-gladiator-ii-2",
        }),
      }),
    });
    const passed = res.status === 200 && res.data?.success && res.data?.code === "VALID";
    results.push({ name: "POST /api/tickets/validate", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Admitted verified booking "${createdBookingRef}" in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.message || res.error})`
    );
  }

  // TEST 16: Admin Live Metrics (GET /api/admin/metrics)
  {
    process.stdout.write("16. Testing GET /api/admin/metrics (PostgreSQL & Redis Live) ... ");
    const res = await request("/api/admin/metrics");
    const passed = res.status === 200 && res.data?.success && res.data?.data?.bookingsCount >= 1;
    results.push({ name: "GET /api/admin/metrics", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Live Revenue: ${res.data.data.totalRevenue} MAD, Bookings: ${res.data.data.bookingsCount} in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.message || res.error})`
    );
  }

  // TEST 17: Auth Logout (POST /api/auth/logout)
  {
    process.stdout.write("17. Testing POST /api/auth/logout ... ");
    const res = await request("/api/auth/logout", { method: "POST" });
    const passed = res.status === 200 && res.data?.success;
    results.push({ name: "POST /api/auth/logout", passed, ...res });
    console.log(
      passed
        ? `✅ PASS (${res.status} - Cookie cleared in ${res.duration}ms)`
        : `❌ FAIL (${res.status} - ${res.data?.error || res.error})`
    );
  }

  // SUMMARY REPORT
  console.log("\n===============================================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`📊  Summary: ${passedCount} / ${results.length} API Endpoints Tested Successfully!`);
  console.log("===============================================================");

  if (passedCount === results.length) {
    console.log("🎉  ALL " + results.length + " BACKEND APIS & AUTH/RBAC ENDPOINTS ARE 100% HEALTHY!");
  } else {
    process.exit(1);
  }
}

runTestSuite();

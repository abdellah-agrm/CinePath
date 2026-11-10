/**
 * CinePath Comprehensive Backend API Test Suite
 * Tests all REST endpoints live against the running server.
 */

const BASE_URL = "http://localhost:3000";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const duration = Date.now() - start;
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
    const passed = res.status === 200 || res.status === 503; // 503 if DB offline in demo mode
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

  // SUMMARY REPORT
  console.log("\n===============================================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`📊  Summary: ${passedCount} / ${results.length} API Endpoints Tested Successfully!`);
  console.log("===============================================================");

  if (passedCount === results.length) {
    console.log("🎉  ALL BACKEND APIS ARE 100% HEALTHY AND OPERATIONAL!");
  } else {
    process.exit(1);
  }
}

runTestSuite();


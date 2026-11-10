/**
 * CinePath Concurrency & Race Condition Simulation Test
 *
 * This test simulates 10 concurrent customers attempting to lock the EXACT same seats
 * (e.g. Seats C9, C10) at the exact same millisecond.
 *
 * Expected Result:
 * - Exactly 1 customer succeeds (200 OK + Lock Token)
 * - Exactly 9 customers are safely rejected (409 Conflict: "Seat already held")
 * - ZERO double bookings
 */

const http = require("http");

const SHOWTIME_ID = "demo-showtime-uuid";
const TARGET_SEATS = ["seat-C9", "seat-C10"];
const CONCURRENT_USERS_COUNT = 10;

async function attemptLock(userId) {
  const payload = JSON.stringify({
    seatIds: TARGET_SEATS,
    lockToken: `token_user_${userId}_${Date.now()}`,
  });

  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/api/showtimes/${SHOWTIME_ID}/lock-seats`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            userId,
            statusCode: res.statusCode,
            response: data,
          });
        });
      }
    );

    req.on("error", (err) => {
      resolve({
        userId,
        statusCode: 500,
        error: err.message,
      });
    });

    req.write(payload);
    req.end();
  });
}

async function runConcurrencyTest() {
  console.log("==================================================");
  console.log("🎬 CinePath Concurrency Race Condition Test");
  console.log(`Simulating ${CONCURRENT_USERS_COUNT} users firing simultaneously at seats: ${TARGET_SEATS.join(", ")}`);
  console.log("==================================================\n");

  const startTimestamp = Date.now();

  // Fire all requests at the exact same millisecond
  const promises = [];
  for (let i = 1; i <= CONCURRENT_USERS_COUNT; i++) {
    promises.push(attemptLock(i));
  }

  const results = await Promise.all(promises);
  const elapsed = Date.now() - startTimestamp;

  const successful = results.filter((r) => r.statusCode === 200);
  const conflicts = results.filter((r) => r.statusCode === 409);
  const errors = results.filter((r) => r.statusCode !== 200 && r.statusCode !== 409);

  console.log(`⏱ Test executed in ${elapsed}ms\n`);
  console.log(`✅ Successes (200 OK): ${successful.length}`);
  console.log(`🛡 Blocked Conflicts (409 Conflict): ${conflicts.length}`);
  if (errors.length > 0) {
    console.log(`⚠️ Network/Server Errors (Server running?): ${errors.length}`);
  }

  console.log("\n--------------------------------------------------");
  if (successful.length === 1 && conflicts.length === CONCURRENT_USERS_COUNT - 1) {
    console.log("🎉 VERIFICATION PASSED: Perfect atomic consistency guaranteed by Redis Lua script!");
  } else if (successful.length === 0 && errors.length === CONCURRENT_USERS_COUNT) {
    console.log("ℹ️ Note: Development server (npm run dev) must be running on port 3000 to test live endpoints.");
  } else {
    console.log(`Results: ${successful.length} won, ${conflicts.length} rejected.`);
  }
  console.log("==================================================");
}

runConcurrencyTest();


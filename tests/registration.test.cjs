"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  createApiHandler,
  getSheetRange,
} = require("../src/services/registration-api.cjs");
const {
  validateRegistration,
  sheetText,
  toSheetRow,
  createRegistration,
} = require("../src/services/registration-service.cjs");

console.log("Running registration service & API tests...");

// 1. Service unit tests
const validData = {
  name: "Kwame Mensah",
  email: "kwame@example.com",
  organisation: "Accra AI Lab",
  country: "Ghana",
  interest: ["Research & development", "Innovation & AI use cases"],
  context: "Looking forward to collaborating on medical AI applications.",
  consent: true,
};

const validated = validateRegistration(validData);
assert.equal(validated.ok, true);
assert.equal(validated.value.name, "Kwame Mensah");

const consentMissing = validateRegistration({ ...validData, consent: false });
assert.equal(consentMissing.ok, false);
assert.ok(consentMissing.errors.consent);

// Test corporate & personal email validation + country normalization
const corpTest1 = validateRegistration({
  name: "Derek Yendoh",
  email: "dyendoh@gmail.com",
  organisation: "Google",
  country: "ghana", // lowercase should normalize to Ghana
  interest: ["Research & development"],
  consent: true,
});
assert.equal(corpTest1.ok, true);
assert.equal(corpTest1.value.email, "dyendoh@gmail.com");
assert.equal(corpTest1.value.country, "Ghana");

const corpTest2 = validateRegistration({
  name: "Derek Yendoh",
  email: "d.yendoh@4th-ir.com",
  organisation: "4th-IR",
  country: "USA", // alias should normalize to United States
  interest: ["Access to AI professionals"],
  consent: true,
});
assert.equal(corpTest2.ok, true);
assert.equal(corpTest2.value.email, "d.yendoh@4th-ir.com");
assert.equal(corpTest2.value.country, "United States");

// Invalid country rejection
const invalidCountryTest = validateRegistration({
  name: "Test User",
  email: "user@example.com",
  organisation: "Test",
  country: "Narnia",
  interest: ["Research & development"],
  consent: true,
});
assert.equal(invalidCountryTest.ok, false);
assert.ok(invalidCountryTest.errors.country);

// Whitespace-only rejection
const invalidData = {
  name: "   ",
  email: "invalid-email",
  organisation: "",
  country: "Ghana",
  consent: true,
};
const failedValidation = validateRegistration(invalidData);
assert.equal(failedValidation.ok, false);
assert.ok(failedValidation.errors.name);
assert.ok(failedValidation.errors.email);
assert.ok(failedValidation.errors.organisation);

const noInterest = validateRegistration({ ...validData, interest: [] });
assert.equal(noInterest.ok, true);
assert.equal(noInterest.value.interest.length, 0);

const withSourceTracking = createRegistration(
  {
    ...validData,
    interest: ["Research & development"],
    source: "newsletter",
    utm: {
      source: "newsletter",
      medium: "email",
      campaign: "spring-hub",
    },
  },
  "utm-key",
);
assert.equal(withSourceTracking.ok, true);
assert.equal(withSourceTracking.registration.status, "received");
assert.equal(withSourceTracking.registration.confirmationEmailSent, false);
assert.equal(withSourceTracking.registration.source, "newsletter");
assert.equal(withSourceTracking.registration.utm.source, "newsletter");

const getInvolvedAstro = fs.readFileSync(
  "./src/pages/get-involved.astro",
  "utf8",
);
assert.match(getInvolvedAstro, /aria-live="polite"/);
assert.match(getInvolvedAstro, /aria-describedby="registration-status"/);
assert.match(getInvolvedAstro, /for="f-name"/);
assert.match(getInvolvedAstro, /for="f-email"/);
assert.match(
  getInvolvedAstro,
  /summary>How this page handles your details<\/summary>/,
);

// Formula injection escaping
assert.equal(sheetText("=SUM(A1:A10)"), "'=SUM(A1:A10)");
assert.equal(sheetText("+cmd"), "'+cmd");
assert.equal(sheetText("-secret"), "'-secret");
assert.equal(sheetText("@directive"), "'@directive");
assert.equal(sheetText("Normal text"), "Normal text");

// Range helper with GOOGLE_SHEET_NAME
assert.equal(getSheetRange({}), "A:L");
assert.equal(
  getSheetRange({ GOOGLE_SHEET_NAME: "Registrations" }),
  "Registrations!A:L",
);
assert.equal(getSheetRange({ GOOGLE_SHEET_RANGE: "Sheet1!B:K" }), "Sheet1!B:K");

// 2. Mocked API tests
const env = {
  GOOGLE_SERVICE_ACCOUNT_EMAIL:
    "service-account@example.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY:
    "-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----\\n",
  GOOGLE_SHEET_ID: "test-sheet-id",
};

function responseMock() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value) {
      this.body = value;
    },
  };
}

const rows = [];
const lookupCalls = [];
const sheetsFactory = ({ auth }) => {
  assert.ok(auth);
  return {
    spreadsheets: {
      values: {
        async get(options) {
          assert.equal(options.spreadsheetId, "test-sheet-id");
          lookupCalls.push(options.range);
          if (options.range === "D:D") {
            return { data: { values: [rows.map((row) => row[3])] } };
          }
          const match = options.range.match(/^A(\d+):C\1$/);
          if (match)
            return {
              data: { values: [rows[Number(match[1]) - 1].slice(0, 3)] },
            };
          throw new Error(`Unexpected lookup range: ${options.range}`);
        },
        async append(options) {
          assert.equal(options.valueInputOption, "RAW");
          assert.equal(options.insertDataOption, "INSERT_ROWS");
          rows.push(options.requestBody.values[0]);
          return { data: {} };
        },
      },
    },
  };
};

(async () => {
  const handler = createApiHandler({
    env,
    sheetsFactory,
    now: () => new Date("2026-11-25T10:00:00.000Z"),
  });

  // First submission: Success (201)
  const res1 = responseMock();
  await handler(
    {
      method: "POST",
      headers: {
        "idempotency-key": "idemp-key-1",
        "x-forwarded-for": "10.0.0.1",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...validData, context: "=not-a-formula" }),
    },
    res1,
  );
  assert.equal(res1.statusCode, 201);
  const body1 = JSON.parse(res1.body);
  assert.equal(body1.ok, true);
  assert.equal(body1.duplicate, false);
  assert.equal(body1.status, "received");
  assert.ok(
    body1.confirmationEmailSent === false ||
      body1.confirmationEmailSent === true,
  );
  assert.ok(body1.registrationId);
  assert.equal(rows.length, 1);
  assert.equal(rows[0][9], "'=not-a-formula"); // formula escaped in the context field
  assert.equal(rows[0][10], "website");
  assert.equal(rows[0][11], "{}");

  // The normal lookup only reads the idempotency-key column, not A:J.
  // Second submission with same idempotency key: Duplicate detected (200)
  const res2 = responseMock();
  await handler(
    {
      method: "POST",
      headers: {
        "idempotency-key": "idemp-key-1",
        "x-forwarded-for": "10.0.0.2",
        "content-type": "application/json",
      },
      body: JSON.stringify(validData),
    },
    res2,
  );
  assert.equal(res2.statusCode, 200);
  const body2 = JSON.parse(res2.body);
  assert.equal(body2.ok, true);
  assert.equal(body2.duplicate, true);
  assert.equal(rows.length, 1); // No new row appended!
  assert.deepEqual(lookupCalls, ["D:D"]);

  // Missing idempotency key: 400
  const res3 = responseMock();
  await handler(
    {
      method: "POST",
      headers: {
        "x-forwarded-for": "10.0.0.3",
        "content-type": "application/json",
      },
      body: JSON.stringify(validData),
    },
    res3,
  );
  assert.equal(res3.statusCode, 400);

  // Concurrent submissions with the same idempotency key should only write once.
  const raceRows = [];
  const raceEnv = {
    ...env,
    GOOGLE_SHEET_ID: "race-sheet-id",
  };
  const raceFactory = () => ({
    spreadsheets: {
      values: {
        async get() {
          return { data: { values: [] } };
        },
        async append(options) {
          raceRows.push(options.requestBody.values[0]);
          await new Promise((resolve) => setTimeout(resolve, 40));
          return { data: {} };
        },
      },
    },
  });
  const raceHandler = createApiHandler({
    env: raceEnv,
    sheetsFactory: raceFactory,
    now: () => new Date("2026-11-25T10:00:00.000Z"),
  });
  const raceResponseA = responseMock();
  const raceResponseB = responseMock();
  await Promise.all([
    raceHandler(
      {
        method: "POST",
        headers: {
          "idempotency-key": "race-key-1",
          "x-forwarded-for": "10.0.0.4",
          "content-type": "application/json",
        },
        body: JSON.stringify(validData),
      },
      raceResponseA,
    ),
    raceHandler(
      {
        method: "POST",
        headers: {
          "idempotency-key": "race-key-1",
          "x-forwarded-for": "10.0.0.5",
          "content-type": "application/json",
        },
        body: JSON.stringify(validData),
      },
      raceResponseB,
    ),
  ]);
  assert.equal(raceRows.length, 1);
  assert.equal(raceResponseA.statusCode, 201);
  assert.equal(raceResponseB.statusCode, 200);
  const raceBodyA = JSON.parse(raceResponseA.body);
  const raceBodyB = JSON.parse(raceResponseB.body);
  assert.equal(raceBodyB.duplicate, true);
  assert.equal(raceBodyB.registrationId, raceBodyA.registrationId);

  // Concurrent failure test: If the in-flight request fails, the concurrent
  // request must also fail (500), NEVER falsely returning 200 success!
  const failEnv = { ...env, GOOGLE_SHEET_ID: "fail-sheet-id" };
  const failFactory = () => ({
    spreadsheets: {
      values: {
        async get() { return { data: { values: [] } }; },
        async append() {
          await new Promise((resolve) => setTimeout(resolve, 30));
          throw new Error("Simulated Sheets write failure");
        },
      },
    },
  });
  const failHandler = createApiHandler({
    env: failEnv,
    sheetsFactory: failFactory,
  });
  const failResponseA = responseMock();
  const failResponseB = responseMock();
  await Promise.all([
    failHandler(
      {
        method: "POST",
        headers: {
          "idempotency-key": "fail-key-1",
          "x-forwarded-for": "10.0.0.40",
          "content-type": "application/json",
        },
        body: JSON.stringify(validData),
      },
      failResponseA,
    ),
    failHandler(
      {
        method: "POST",
        headers: {
          "idempotency-key": "fail-key-1",
          "x-forwarded-for": "10.0.0.41",
          "content-type": "application/json",
        },
        body: JSON.stringify(validData),
      },
      failResponseB,
    ),
  ]);
  assert.equal(failResponseA.statusCode, 503);
  assert.equal(failResponseB.statusCode, 503);
  assert.equal(JSON.parse(failResponseA.body).error, "registration_unavailable");
  assert.equal(JSON.parse(failResponseB.body).error, "registration_unavailable");

  // Validation failure: 422
  const res4 = responseMock();
  await handler(
    {
      method: "POST",
      headers: {
        "idempotency-key": "idemp-key-2",
        "x-forwarded-for": "10.0.0.6",
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: "" }),
    },
    res4,
  );
  assert.equal(res4.statusCode, 422);

  // Invalid content type: 415
  const resContentType = responseMock();
  await handler(
    {
      method: "POST",
      headers: {
        "idempotency-key": "idemp-key-content",
        "x-forwarded-for": "10.0.0.7",
        "content-type": "text/plain",
      },
      body: JSON.stringify(validData),
    },
    resContentType,
  );
  assert.equal(resContentType.statusCode, 415);

  // Disallowed origin: 403
  const resOrigin = responseMock();
  await handler(
    {
      method: "POST",
      headers: {
        "idempotency-key": "idemp-key-origin",
        origin: "https://evil.example",
        "content-type": "application/json",
      },
      body: JSON.stringify(validData),
    },
    resOrigin,
  );
  assert.equal(resOrigin.statusCode, 403);

  // Honeypot: bot-filled field is rejected before any sheet write.
  const resBot = responseMock();
  await handler(
    {
      method: "POST",
      headers: {
        "idempotency-key": "idemp-key-bot",
        "x-forwarded-for": "10.0.0.8",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...validData, website: "https://spam.example" }),
    },
    resBot,
  );
  assert.equal(resBot.statusCode, 400);
  assert.equal(rows.length, 1);

  // Oversized idempotency key: 400
  const res6 = responseMock();
  await handler(
    {
      method: "POST",
      headers: {
        "idempotency-key": "x".repeat(101),
        "x-forwarded-for": "10.0.0.9",
        "content-type": "application/json",
      },
      body: JSON.stringify(validData),
    },
    res6,
  );
  assert.equal(res6.statusCode, 400);

  // Invalid idempotency key characters: 400
  const res7 = responseMock();
  await handler(
    {
      method: "POST",
      headers: {
        "idempotency-key": "bad key",
        "x-forwarded-for": "10.0.0.10",
        "content-type": "application/json",
      },
      body: JSON.stringify(validData),
    },
    res7,
  );
  assert.equal(res7.statusCode, 400);

  // Distributed rate limit test (Upstash / KV REST pipeline)
  const origFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, opts) => {
      assert.ok(url.includes("/pipeline"));
      return {
        ok: true,
        async json() {
          // Simulated pipeline response where count exceeds limit (e.g. 11)
          return [{ result: 11 }, { result: "OK" }];
        },
      };
    };

    const distHandler = createApiHandler({
      env: {
        ...env,
        UPSTASH_REDIS_REST_URL: "https://mock-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "mock-token",
      },
      sheetsFactory,
    });
    const distResponse = responseMock();
    await distHandler(
      {
        method: "POST",
        headers: {
          "idempotency-key": "dist-key-1",
          "x-forwarded-for": "10.0.0.99",
          "content-type": "application/json",
        },
        body: JSON.stringify(validData),
      },
      distResponse,
    );
    assert.equal(distResponse.statusCode, 429);
    assert.equal(JSON.parse(distResponse.body).error, "rate_limited");
    assert.equal(distResponse.headers["Retry-After"], "600");
  } finally {
    globalThis.fetch = origFetch;
  }

  console.log("✅ All registration service & API tests passed!");
})();

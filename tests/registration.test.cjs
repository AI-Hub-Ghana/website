"use strict";

const assert = require("node:assert/strict");
const { createApiHandler, getSheetRange } = require("../src/services/registration-api.cjs");
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
};

const validated = validateRegistration(validData);
assert.equal(validated.ok, true);
assert.equal(validated.value.name, "Kwame Mensah");

// Whitespace-only rejection
const invalidData = {
  name: "   ",
  email: "invalid-email",
  organisation: "",
  country: "Ghana",
};
const failedValidation = validateRegistration(invalidData);
assert.equal(failedValidation.ok, false);
assert.ok(failedValidation.errors.name);
assert.ok(failedValidation.errors.email);
assert.ok(failedValidation.errors.organisation);

// Formula injection escaping
assert.equal(sheetText("=SUM(A1:A10)"), "'=SUM(A1:A10)");
assert.equal(sheetText("+cmd"), "'+cmd");
assert.equal(sheetText("-secret"), "'-secret");
assert.equal(sheetText("@directive"), "'@directive");
assert.equal(sheetText("Normal text"), "Normal text");

// Range helper with GOOGLE_SHEET_NAME
assert.equal(getSheetRange({}), "A:J");
assert.equal(getSheetRange({ GOOGLE_SHEET_NAME: "Registrations" }), "Registrations!A:J");
assert.equal(getSheetRange({ GOOGLE_SHEET_RANGE: "Sheet1!B:K" }), "Sheet1!B:K");

// 2. Mocked API tests
const env = {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "service-account@example.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----\\n",
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
const sheetsFactory = ({ auth }) => {
  assert.ok(auth);
  return {
    spreadsheets: {
      values: {
        async get(options) {
          assert.equal(options.spreadsheetId, "test-sheet-id");
          assert.equal(options.range, "A:J");
          return { data: { values: rows } };
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
      headers: { "idempotency-key": "idemp-key-1" },
      body: JSON.stringify({ ...validData, context: "=not-a-formula" }),
    },
    res1
  );
  assert.equal(res1.statusCode, 201);
  const body1 = JSON.parse(res1.body);
  assert.equal(body1.ok, true);
  assert.equal(body1.duplicate, false);
  assert.ok(body1.registrationId);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].at(-1), "'=not-a-formula"); // formula escaped

  // Second submission with same idempotency key: Duplicate detected (200)
  const res2 = responseMock();
  await handler(
    {
      method: "POST",
      headers: { "idempotency-key": "idemp-key-1" },
      body: JSON.stringify(validData),
    },
    res2
  );
  assert.equal(res2.statusCode, 200);
  const body2 = JSON.parse(res2.body);
  assert.equal(body2.ok, true);
  assert.equal(body2.duplicate, true);
  assert.equal(rows.length, 1); // No new row appended!

  // Missing idempotency key: 400
  const res3 = responseMock();
  await handler(
    {
      method: "POST",
      headers: {},
      body: JSON.stringify(validData),
    },
    res3
  );
  assert.equal(res3.statusCode, 400);

  // Validation failure: 422
  const res4 = responseMock();
  await handler(
    {
      method: "POST",
      headers: { "idempotency-key": "idemp-key-2" },
      body: JSON.stringify({ name: "" }),
    },
    res4
  );
  assert.equal(res4.statusCode, 422);

  // Method not allowed: 405
  const res5 = responseMock();
  await handler({ method: "GET" }, res5);
  assert.equal(res5.statusCode, 405);

  console.log("✅ All registration service & API tests passed!");
})();

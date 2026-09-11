/**
 * Quick smoke-test for the registration API against a live local vercel dev instance.
 * Run AFTER starting `vercel dev` in the ai-hub-ghana-website folder:
 *
 *   node scripts/test-api-local.cjs
 *
 * Or against production:
 *   BASE_URL=https://your-site.vercel.app node scripts/test-api-local.cjs
 */
"use strict";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ENDPOINT = `${BASE_URL}/api/register`;

const key = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const payload = {
  name: "Local Test User",
  email: `test+${Date.now()}@example.com`,
  organisation: "Test Organisation",
  country: "Ghana",
  interest: ["Access to AI professionals", "Research & development"],
  context: "Automated smoke-test from test-api-local.cjs",
  consent: true,
};

async function run() {
  console.log(`\nPOST ${ENDPOINT}`);
  console.log(`Idempotency-Key: ${key}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("\n❌  Network error — is vercel dev running?", err.message);
    process.exit(1);
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  console.log(`\nStatus: ${res.status} ${res.statusText}`);
  console.log("Response:", JSON.stringify(json, null, 2));

  if (res.status === 201 && json.ok) {
    console.log("\n✅  Registration written to Google Sheet.");
    console.log(`    Reference ID : ${json.registrationId}`);
    console.log(`    Event ID     : ${json.eventId}`);
    console.log(`    Received at  : ${json.receivedAt}`);
  } else if (res.status === 200 && json.duplicate) {
    console.log(
      "\n⚠️   Duplicate — row already exists for this idempotency key.",
    );
  } else if (res.status === 503 && json.error === "registration_unconfigured") {
    console.error("\n❌  API is missing environment variables.");
    console.error(
      "    Make sure .env.local exists and vercel dev is loading it.",
    );
    process.exit(1);
  } else if (res.status === 422) {
    console.error("\n❌  Validation failed:", json.fields);
    process.exit(1);
  } else {
    console.error("\n❌  Unexpected response — check the server logs.");
    process.exit(1);
  }
}

run();

"use strict";

const { google } = require("googleapis");
const {
  createRegistration,
  toSheetRow,
} = require("./registration-service.cjs");

const DEFAULT_SHEET_RANGE = "A:J";

function getSheetRange(env) {
  if (env.GOOGLE_SHEET_RANGE) return env.GOOGLE_SHEET_RANGE;
  if (env.GOOGLE_SHEET_NAME) return `${env.GOOGLE_SHEET_NAME}!A:J`;
  return DEFAULT_SHEET_RANGE;
}

function requiredConfig(env = process.env) {
  return [
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_SHEET_ID",
  ].filter((key) => !env[key]);
}

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function createSheetsClient(env = process.env, sheetsFactory = google.sheets) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return sheetsFactory({ version: "v4", auth });
}

async function existingRegistration(sheets, env, idempotencyKey) {
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: getSheetRange(env),
  });
  const row = (result.data.values || []).find(
    (values) => values[3] === idempotencyKey,
  );
  if (!row) return null;
  return {
    registrationId: row[0],
    eventId: row[1],
    receivedAt: row[2],
  };
}

async function appendRegistration(sheets, env, registration) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: getSheetRange(env),
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [toSheetRow(registration)] },
  });
}

function createApiHandler({
  env = process.env,
  sheetsFactory = google.sheets,
  now = () => new Date(),
} = {}) {
  return async function registrationHandler(request, response) {
    if (request.method !== "POST") {
      return json(response, 405, { error: "method_not_allowed" });
    }
    const missing = requiredConfig(env);
    if (missing.length) {
      return json(response, 503, { error: "registration_unconfigured" });
    }

    const idempotencyKey =
      request.headers["idempotency-key"] || request.headers["Idempotency-Key"];
    if (!idempotencyKey || idempotencyKey.length > 200) {
      return json(response, 400, { error: "missing_idempotency_key" });
    }

    try {
      const body =
        typeof request.body === "object"
          ? request.body
          : JSON.parse(request.body || "{}");
      const created = createRegistration(body, idempotencyKey, now());
      if (!created.ok) {
        return json(response, 422, {
          error: "validation_failed",
          fields: created.errors,
        });
      }

      const sheets = createSheetsClient(env, sheetsFactory);
      const existing = await existingRegistration(sheets, env, idempotencyKey);
      if (existing) {
        return json(response, 200, { ok: true, duplicate: true, ...existing });
      }

      await appendRegistration(sheets, env, created.registration);
      return json(response, 201, {
        ok: true,
        duplicate: false,
        registrationId: created.registration.registrationId,
        eventId: created.registration.eventId,
        receivedAt: created.registration.receivedAt,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return json(response, 503, { error: "registration_unavailable" });
    }
  };
}

module.exports = { createApiHandler, requiredConfig, getSheetRange };

"use strict";

const { google } = require("googleapis");
const {
  createRegistration,
  toSheetRow,
} = require("./registration-service.cjs");

const DEFAULT_SHEET_RANGE = "A:L";
const MAX_IDEMPOTENCY_KEY_LENGTH = 100;
const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_MAX_ENTRIES = 5000;
const REQUEST_TIMEOUT_MS = 10000;

function getSheetRange(env) {
  if (env.GOOGLE_SHEET_RANGE) return env.GOOGLE_SHEET_RANGE;
  if (env.GOOGLE_SHEET_NAME) return `${env.GOOGLE_SHEET_NAME}!A:L`;
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

let cachedSheetsClient = null;
let cachedClientKey = null;

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

function getSheetsClient(env = process.env, sheetsFactory = google.sheets) {
  if (sheetsFactory !== google.sheets) {
    return createSheetsClient(env, sheetsFactory);
  }
  const clientKey = `${env.GOOGLE_SERVICE_ACCOUNT_EMAIL}:${env.GOOGLE_SHEET_ID}`;
  if (cachedSheetsClient && cachedClientKey === clientKey) {
    return cachedSheetsClient;
  }
  cachedSheetsClient = createSheetsClient(env, sheetsFactory);
  cachedClientKey = clientKey;
  return cachedSheetsClient;
}

// Recent successful idempotency keys are cached per warm function instance.
// This is a performance optimization, not the primary source of correctness.
const recentIdempotencyMap = new Map();
const MAX_RECENT_KEYS = 1000;

function rememberIdempotency(key, record) {
  if (recentIdempotencyMap.size >= MAX_RECENT_KEYS) {
    const oldestKey = recentIdempotencyMap.keys().next().value;
    if (oldestKey) recentIdempotencyMap.delete(oldestKey);
  }
  recentIdempotencyMap.set(key, record);
}

async function existingRegistration(sheets, env, idempotencyKey) {
  const cached = recentIdempotencyMap.get(idempotencyKey);
  if (cached) return cached;

  // Only read the idempotency-key column. The old A:J read downloaded the
  // entire registration sheet on every submission and became slower as the
  // sheet grew.
  const result = await withTimeout(
    (signal) =>
      sheets.spreadsheets.values.get(
        {
          spreadsheetId: env.GOOGLE_SHEET_ID,
          range: getIdempotencyRange(env),
          majorDimension: "COLUMNS",
        },
        signal ? { signal } : undefined,
      ),
    REQUEST_TIMEOUT_MS,
    "Google Sheets lookup timed out",
  );

  const values = result.data.values || [];
  const keys = values[0] || [];
  const index = keys.indexOf(idempotencyKey);
  if (index === -1) return null;

  // Fetch the small metadata range for the matched row only.
  const rowNumber = index + 1;
  const metadata = await withTimeout(
    (signal) =>
      sheets.spreadsheets.values.get(
        {
          spreadsheetId: env.GOOGLE_SHEET_ID,
          range: getMetadataRange(env, rowNumber),
        },
        signal ? { signal } : undefined,
      ),
    REQUEST_TIMEOUT_MS,
    "Google Sheets record lookup timed out",
  );
  const row = (metadata.data.values || [])[0] || [];
  const record = {
    registrationId: row[0] || null,
    eventId: row[1] || null,
    receivedAt: row[2] || null,
  };
  rememberIdempotency(idempotencyKey, record);
  return record;
}

function sheetPrefix(env) {
  if (env.GOOGLE_SHEET_RANGE) {
    const bang = env.GOOGLE_SHEET_RANGE.lastIndexOf("!");
    return bang >= 0 ? `${env.GOOGLE_SHEET_RANGE.slice(0, bang)}!` : "";
  }
  if (env.GOOGLE_SHEET_NAME) return `${env.GOOGLE_SHEET_NAME}!`;
  return "";
}

function columnToNumber(column) {
  let number = 0;
  for (const char of column.toUpperCase())
    number = number * 26 + char.charCodeAt(0) - 64;
  return number;
}

function numberToColumn(number) {
  let column = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    number = Math.floor((number - 1) / 26);
  }
  return column;
}

function getStartColumn(env) {
  const range = env.GOOGLE_SHEET_RANGE;
  if (range) {
    const match = range.match(/(?:^|!)([A-Z]+)\d*:/i);
    if (match) return match[1].toUpperCase();
  }
  return "A";
}

function getIdempotencyRange(env) {
  const idempotencyColumn = numberToColumn(
    columnToNumber(getStartColumn(env)) + 3,
  );
  return `${sheetPrefix(env)}${idempotencyColumn}:${idempotencyColumn}`;
}

function getMetadataRange(env, rowNumber) {
  const start = columnToNumber(getStartColumn(env));
  return `${sheetPrefix(env)}${numberToColumn(start)}${rowNumber}:${numberToColumn(start + 2)}${rowNumber}`;
}

function withTimeout(operation, timeoutMs, message) {
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      if (controller) controller.abort();
      reject(new Error(message));
    }, timeoutMs);
  });

  const promise =
    typeof operation === "function"
      ? operation(controller ? controller.signal : undefined)
      : operation;

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
}

async function appendRegistration(sheets, env, registration) {
  await withTimeout(
    (signal) =>
      sheets.spreadsheets.values.append(
        {
          spreadsheetId: env.GOOGLE_SHEET_ID,
          range: getSheetRange(env),
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: [toSheetRow(registration)] },
        },
        signal ? { signal } : undefined,
      ),
    REQUEST_TIMEOUT_MS,
    "Google Sheets append timed out",
  );
  rememberIdempotency(registration.idempotencyKey, {
    registrationId: registration.registrationId,
    eventId: registration.eventId,
    receivedAt: registration.receivedAt,
  });
}

const rateLimitMap = new Map();
const inFlightIdempotencyMap = new Map();

function getAllowedOrigins(env = process.env) {
  const raw = env.ALLOWED_ORIGINS || "";
  const base = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const derived = [];
  if (env.VERCEL_URL) derived.push(`https://${env.VERCEL_URL}`);
  if (env.VERCEL_PROJECT_PRODUCTION_URL)
    derived.push(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if (env.VERCEL_BRANCH_URL) derived.push(`https://${env.VERCEL_BRANCH_URL}`);
  if (env.URL) derived.push(env.URL);

  return [
    ...new Set([
      ...base,
      ...derived,
      "http://localhost:3000",
      "http://localhost:4321",
      "http://127.0.0.1:3000",
      "https://localhost:3000",
      "https://127.0.0.1:3000",
    ]),
  ];
}

function isAllowedOrigin(request, env = process.env) {
  const origin = request.headers["origin"] || request.headers["Origin"] || null;
  if (!origin) return true;
  const allowed = getAllowedOrigins(env);
  return allowed.some(
    (candidate) =>
      candidate === origin ||
      candidate.replace(/\/$/, "") === origin.replace(/\/$/, ""),
  );
}

function getClientKey(request) {
  const forwarded =
    request.headers["x-forwarded-for"] || request.headers["X-Forwarded-For"];
  return String(forwarded || request.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim()
    .slice(0, 100);
}

async function checkDistributedRateLimit(clientKey, env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token || typeof globalThis.fetch !== "function") {
    return null;
  }
  try {
    const key = `rate_limit:registration:${clientKey}`;
    const windowSec = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
    const pipelineUrl = `${url.replace(/\/$/, "")}/pipeline`;
    const response = await fetch(pipelineUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSec],
      ]),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const count = data?.[0]?.result;
    if (typeof count === "number") {
      return count > RATE_LIMIT_MAX_REQUESTS;
    }
  } catch (err) {
    console.warn(
      "Distributed rate limit check failed, falling back to in-memory limiter:",
      err.message,
    );
  }
  return null;
}

async function isRateLimited(request, env = process.env) {
  const key = getClientKey(request);
  const distributedLimited = await checkDistributedRateLimit(key, env);
  if (distributedLimited !== null) {
    return distributedLimited;
  }

  const now = Date.now();
  const existing = rateLimitMap.get(key);
  if (!existing || now - existing.startedAt >= RATE_LIMIT_WINDOW_MS) {
    if (rateLimitMap.size >= RATE_LIMIT_MAX_ENTRIES) {
      for (const [entryKey, entry] of rateLimitMap) {
        if (now - entry.startedAt >= RATE_LIMIT_WINDOW_MS)
          rateLimitMap.delete(entryKey);
      }
      if (rateLimitMap.size >= RATE_LIMIT_MAX_ENTRIES) return true;
    }
    rateLimitMap.set(key, { startedAt: now, count: 1 });
    return false;
  }
  existing.count += 1;
  return existing.count > RATE_LIMIT_MAX_REQUESTS;
}

function bodyByteLength(body) {
  if (body == null) return 0;
  if (typeof body === "string") return Buffer.byteLength(body, "utf8");
  try {
    return Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch (_) {
    return MAX_BODY_BYTES + 1;
  }
}

async function withIdempotencyGuard(idempotencyKey, run) {
  if (!idempotencyKey) return run();
  const existing = inFlightIdempotencyMap.get(idempotencyKey);
  if (existing) {
    // Await original in-flight request rather than immediately returning a fake success.
    // If the original request fails, this will throw/reject and be caught appropriately.
    const originalResult = await existing;
    if (
      originalResult &&
      (originalResult.status === 201 || originalResult.status === 200)
    ) {
      return {
        status: 200,
        body: {
          ...originalResult.body,
          duplicate: true,
          inFlight: false,
        },
      };
    }
    return originalResult;
  }
  const pending = run().finally(() => {
    inFlightIdempotencyMap.delete(idempotencyKey);
  });
  inFlightIdempotencyMap.set(idempotencyKey, pending);
  return pending;
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

    if (await isRateLimited(request, env)) {
      response.setHeader("Retry-After", "600");
      return json(response, 429, { error: "rate_limited" });
    }

    const idempotencyKey =
      request.headers["idempotency-key"] || request.headers["Idempotency-Key"];
    if (
      !idempotencyKey ||
      typeof idempotencyKey !== "string" ||
      idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH ||
      !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)
    ) {
      return json(response, 400, { error: "invalid_idempotency_key" });
    }

    const contentType =
      request.headers["content-type"] || request.headers["Content-Type"] || "";
    if (contentType && !contentType.includes("application/json")) {
      return json(response, 415, { error: "unsupported_media_type" });
    }

    if (!isAllowedOrigin(request, env)) {
      return json(response, 403, { error: "origin_not_allowed" });
    }

    if (bodyByteLength(request.body) > MAX_BODY_BYTES) {
      return json(response, 413, { error: "request_too_large" });
    }

    try {
      const result = await withIdempotencyGuard(idempotencyKey, async () => {
        const body =
          typeof request.body === "object"
            ? request.body
            : JSON.parse(request.body || "{}");

        // Cheap bot/spam trap. Do not persist the honeypot field.
        if (
          body &&
          typeof body === "object" &&
          String(body.website || "").trim()
        ) {
          return { status: 400, body: { error: "invalid_request" } };
        }

        const created = createRegistration(body, idempotencyKey, now());
        if (!created.ok) {
          return {
            status: 422,
            body: { error: "validation_failed", fields: created.errors },
          };
        }

        const sheets = getSheetsClient(env, sheetsFactory);
        const existing = await existingRegistration(
          sheets,
          env,
          idempotencyKey,
        );
        if (existing) {
          return {
            status: 200,
            body: {
              ok: true,
              duplicate: true,
              status: "received",
              confirmationEmailSent: false,
              ...existing,
            },
          };
        }

        await appendRegistration(sheets, env, created.registration);
        return {
          status: 201,
          body: {
            ok: true,
            duplicate: false,
            status: "received",
            confirmationEmailSent: false,
            registrationId: created.registration.registrationId,
            eventId: created.registration.eventId,
            receivedAt: created.registration.receivedAt,
          },
        };
      });

      return json(response, result.status, result.body);
    } catch (error) {
      console.error("Registration error:", error);
      return json(response, 503, { error: "registration_unavailable" });
    }
  };
}

module.exports = { createApiHandler, requiredConfig, getSheetRange };

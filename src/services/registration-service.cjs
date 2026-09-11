"use strict";

const crypto = require("node:crypto");

const EVENT_ID = "ai-hub-ghana-showcase-2026-11-25";
const ALLOWED_INTERESTS = new Set([
  "Access to AI professionals",
  "Training & capacity building",
  "Research & development",
  "Innovation & AI use cases",
  "AI governance & compliance",
  "Access to clients",
  "Something else",
]);

function textValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

const COUNTRIES = require("../data/countries.json");

const COUNTRY_LOOKUP = new Map();
COUNTRIES.forEach((c) => {
  COUNTRY_LOOKUP.set(c.toLowerCase(), c);
});

// Common synonyms / abbreviations
const COUNTRY_ALIASES = {
  "usa": "United States",
  "us": "United States",
  "united states of america": "United States",
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  "uae": "United Arab Emirates",
  "u.a.e.": "United Arab Emirates",
  "cote d'ivoire": "Ivory Coast (Côte d'Ivoire)",
  "cote divoire": "Ivory Coast (Côte d'Ivoire)",
  "côte d'ivoire": "Ivory Coast (Côte d'Ivoire)",
  "drc": "Democratic Republic of the Congo",
  "dr congo": "Democratic Republic of the Congo",
  "congo drc": "Democratic Republic of the Congo",
  "korea": "South Korea",
  "south korea": "South Korea",
  "russia": "Russia",
  "russian federation": "Russia",
  "czech republic": "Czech Republic (Czechia)",
  "czechia": "Czech Republic (Czechia)",
};

Object.entries(COUNTRY_ALIASES).forEach(([alias, canonical]) => {
  COUNTRY_LOOKUP.set(alias.toLowerCase(), canonical);
});

function normalizeCountry(raw) {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.trim().toLowerCase();
  return COUNTRY_LOOKUP.get(cleaned) || null;
}

// WHATWG standard RFC 5322 compatible email pattern supporting personal & corporate domains
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validateRegistration(input) {
  const source = input && typeof input === "object" ? input : {};
  const name = textValue(source.name);
  const email = textValue(source.email).toLowerCase();
  const organisation = textValue(source.organisation);
  const rawCountry = textValue(source.country);
  const context = textValue(source.context);
  const interests = Array.isArray(source.interest) ? source.interest : [];
  const errors = {};

  if (!name) errors.name = "Enter your name.";
  else if (name.length > 160)
    errors.name = "Your name must be 160 characters or fewer.";

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > 254 || !EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address (e.g. name@organisation.com).";
  }

  if (!organisation) errors.organisation = "Enter your organisation.";
  else if (organisation.length > 200)
    errors.organisation = "Your organisation must be 200 characters or fewer.";

  let validCountry = "";
  if (!rawCountry) {
    errors.country = "Select your country.";
  } else {
    const normalized = normalizeCountry(rawCountry);
    if (!normalized) {
      errors.country = "Please select a valid country from the list.";
    } else {
      validCountry = normalized;
    }
  }

  if (context.length > 5000)
    errors.context = "Your context must be 5,000 characters or fewer.";

  if (
    !interests.every(
      (interest) =>
        typeof interest === "string" && ALLOWED_INTERESTS.has(interest),
    )
  ) {
    errors.interest = "Choose only the listed areas of interest.";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      email,
      organisation,
      country: validCountry,
      interest: interests,
      context,
    },
  };
}

function sheetText(value) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function toSheetRow(registration) {
  return [
    sheetText(registration.registrationId),
    sheetText(registration.eventId),
    sheetText(registration.receivedAt),
    sheetText(registration.idempotencyKey),
    sheetText(registration.name),
    sheetText(registration.email),
    sheetText(registration.organisation),
    sheetText(registration.country),
    sheetText(registration.interest.join(", ")),
    sheetText(registration.context),
  ];
}

function createRegistration(input, idempotencyKey, now = new Date()) {
  const validated = validateRegistration(input);
  if (!validated.ok) return validated;
  return {
    ok: true,
    registration: {
      registrationId: crypto.randomUUID(),
      eventId: EVENT_ID,
      receivedAt: now.toISOString(),
      idempotencyKey,
      ...validated.value,
    },
  };
}

module.exports = {
  ALLOWED_INTERESTS,
  COUNTRIES,
  EVENT_ID,
  createRegistration,
  normalizeCountry,
  sheetText,
  toSheetRow,
  validateRegistration,
};

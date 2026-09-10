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

function validateRegistration(input) {
  const source = input && typeof input === "object" ? input : {};
  const name = textValue(source.name);
  const email = textValue(source.email);
  const organisation = textValue(source.organisation);
  const country = textValue(source.country);
  const context = textValue(source.context);
  const interests = Array.isArray(source.interest) ? source.interest : [];
  const errors = {};

  if (!name) errors.name = "Enter your name.";
  else if (name.length > 160)
    errors.name = "Your name must be 160 characters or fewer.";
  if (!email) errors.email = "Enter your email address.";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";
  if (!organisation) errors.organisation = "Enter your organisation.";
  else if (organisation.length > 200)
    errors.organisation = "Your organisation must be 200 characters or fewer.";
  if (!country) errors.country = "Enter your country.";
  else if (country.length > 100)
    errors.country = "Your country must be 100 characters or fewer.";
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
    value: { name, email, organisation, country, interest: interests, context },
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
  EVENT_ID,
  createRegistration,
  sheetText,
  toSheetRow,
  validateRegistration,
};

# AI Hub Ghana Website — Current Project Context

This is an Astro 7 + Tailwind CSS v4 website for the AI Hub, Ghana launch and live AI showcase at GABS 2026.

The project has already gone through a P0 → P3 engineering review and refinement. Do NOT revert or replace the existing architecture without a clear reason.

## Current architecture

- Astro 7 static frontend
- Tailwind CSS v4
- Vercel deployment
- Vercel serverless API
- Google Sheets API for registration storage
- Two main pages:

  - `/` — event landing page
  - `/get-involved` — registration page

- Registration endpoint:

  - `POST /api/registrations`

- `/api/register` is retained as an alias.

## P0 fixes already implemented

Registration was the highest-priority issue.

The original implementation read the entire Google Sheet `A:J` on every registration to check the idempotency key. This was the main performance problem.

It has been changed to:

1. Read only the idempotency-key column.
2. Fetch only the matching row's metadata when a duplicate is found.
3. Cache recent successful idempotency keys per warm serverless instance.
4. Add Google Sheets request timeouts.
5. Add request body size protection.
6. Add basic in-memory rate limiting.
7. Validate idempotency keys strictly.
8. Add a client-side 15-second request timeout.
9. Preserve form data after submission failure.
10. Keep the submit button disabled after successful submission to prevent accidental duplicates.
11. Add a honeypot field for basic bot protection.
12. Preserve formula-injection protection before writing to Google Sheets.

Important limitation:
Google Sheets is still the persistent idempotency store. The current implementation cannot provide true atomic distributed idempotency across multiple Vercel instances. If production scale requires stronger guarantees, migrate idempotency handling to a persistent KV/database.

## P1 fixes already implemented

Performance and production improvements include:

- Removed large duplicate image assets.
- Converted photographic assets to WebP.
- Removed unnecessary duplicate `public/img` asset tree.
- Page-specific CSS loading:

  - `launch.css` only loads on the homepage.
  - `participation.css` loads on the registration page.

- Removed obsolete/dead frontend code.
- Added basic security headers through `vercel.json`.
- Registration UX was improved without changing the visual design direction.

## P2 fixes already implemented

- Accessibility improvements to the country combobox.
- Proper option IDs and `aria-activedescendant`.
- Event structured data / JSON-LD.
- `PUBLIC_SITE_URL` support for absolute canonical and structured-data URLs.
- Favicon configuration cleaned up.
- README/project documentation updated.
- CI now runs:

  - `npm run check`
  - `npm test`
  - `npm run build`

- TypeScript checking is available through `npm run lint`.

## P3 fixes already implemented

- Logo/home navigation uses `/` instead of `index.html`.
- Mobile navigation moves focus to the first menu link when opened.
- Escape restores focus to the menu button.
- Improved Open Graph metadata.
- Added OG image type metadata.
- Registration form accessibility metadata improved.
- Removed obsolete asset references.
- Final project structure and README have been cleaned up.

## Current important files

Frontend:

- `src/pages/index.astro`
- `src/pages/get-involved.astro`
- `src/layouts/BaseLayout.astro`
- `src/components/navigation/Navbar.astro`
- `src/components/common/Footer.astro`

Registration:

- `api/registrations.js`
- `api/register.js`
- `src/services/registration-api.cjs`
- `src/services/registration-service.cjs`
- `src/scripts/participation.ts`
- `tests/registration.test.cjs`

Styles:

- `src/styles/global.css`
- `src/styles/launch.css`
- `src/styles/participation.css`
- `src/styles/toast.css`
- `src/styles/print.css`

Configuration:

- `astro.config.mjs`
- `vercel.json`
- `.env.local.example`
- `.github/workflows/ci.yml`

## Environment variables

Required:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`

Optional:

- `GOOGLE_SHEET_NAME`
- `GOOGLE_SHEET_RANGE`
- `PUBLIC_SITE_URL`

For production, set `PUBLIC_SITE_URL` to the actual deployed origin.

## Registration sheet schema

The registration service writes 10 columns:

1. Registration ID
2. Event ID
3. Timestamp
4. Idempotency Key
5. Full Name
6. Work Email
7. Organisation
8. Country
9. Interest Areas
10. Context / Notes

## Important development rules

Before modifying anything:

1. Inspect the existing implementation.
2. Preserve the current architecture unless there is a demonstrated reason to change it.
3. Do not reintroduce deleted files or duplicate assets.
4. Do not bring back full-sheet Google Sheets reads.
5. Do not remove idempotency protection.
6. Do not expose Google credentials client-side.
7. Keep accessibility behavior intact.
8. Keep reduced-motion support intact.
9. Prefer small targeted changes over rewrites.
10. Run relevant tests after changes.

## Final validation

A fresh local environment should run:

```bash
npm ci
npm test
npm run check
npm run build
```

The current source has passed static/syntax validation. The remaining dependency-level validation should be performed in a normal development/CI environment with network access.

## Current status

The project is considered structurally cleaned up and production-oriented.

Future work should focus on:

- actual deployed registration latency testing,
- visual QA across desktop/mobile,
- real Google Sheets integration testing,
- final content/brand approval,
- and, if registration volume grows, migrating idempotency/rate limiting from in-memory/serverless storage to a persistent service.

Do not perform another broad rewrite unless a concrete regression or requirement requires it.



You are working on the AI Hub Ghana Astro website.

IMPORTANT: The latest P0–P3 cleanup introduced a visual regression on the `/get-involved` registration page. DO NOT assume the existing styling is correct. Diagnose the regression first, then fix it.

The current registration page has these visible problems:

- Header/navbar styling is broken.
- `AI HUB GHANA` appears as plain text instead of the intended brand/logo treatment.
- Navigation links are concatenated instead of being laid out correctly.
- `Register for free` and `Menu +` are also running together.
- There is excessive vertical whitespace between the navbar and page content.
- The registration page layout is overflowing horizontally/vertically.
- The left content column and registration card are not positioned/sized correctly.
- The submit button is not appearing correctly; only its text may be visible or it may be pushed/clipped outside the expected form layout.
- Typography, spacing, and component styling appear inconsistent.
- Some CSS appears to be loading because the registration card has partial styling, so investigate CSS imports/loading/order rather than assuming all CSS is missing.

Your task is to perform a focused UI regression audit and fix ALL affected areas, not only the issues listed above.

First inspect:

1. `src/layouts/BaseLayout.astro`
2. `src/pages/get-involved.astro`
3. `src/components/navigation/Navbar.astro`
4. `src/components/get-involved/InterestForm.astro`
5. `src/scripts/participation.ts`
6. `src/styles/global.css`
7. `src/styles/participation.css`
8. `src/styles/launch.css`
9. Any component CSS/classes used by the navbar, form, buttons, layout and responsive breakpoints.
10. `astro.config.mjs`

Pay particular attention to the P1 change that made CSS page-specific. Verify that this did not accidentally remove CSS dependencies required by shared components.

Do NOT solve this by simply importing every stylesheet globally. Preserve the intended page-specific CSS architecture where possible.

Check for:

- Missing stylesheet imports
- Incorrect stylesheet loading conditions
- CSS cascade/order conflicts
- Tailwind v4 class generation issues
- Invalid/removed utility classes
- Component styles that were accidentally removed
- `display`, `position`, `overflow`, `width`, `max-width`, `height`, `grid`, and `flex` conflicts
- `min-width` causing viewport overflow
- Fixed widths that don't respond correctly
- Absolute/fixed positioning that breaks the page
- Button styles being overridden or stripped
- Form elements being clipped
- Incorrect z-index
- Responsive breakpoint regressions
- Header/mobile navigation regressions
- Duplicate or nested layout containers
- Incorrect `<main>` structure
- Any styles that depend on `launch.css` but are now unavailable on `/get-involved`

The intended design should remain visually consistent with the original AI Hub Ghana website. Do not redesign the page. Restore the existing design.

Responsive requirements:

Desktop:
- Navbar should be correctly aligned and spaced.
- Main registration section should use the intended two-column layout.
- Left content and right registration card should remain within the viewport.
- No horizontal overflow.
- Registration card should have its full form visible through normal scrolling.
- Submit button must be fully visible and styled.

Tablet:
- Columns should resize gracefully.
- No clipped content or horizontal scrolling.
- Form fields should remain usable.

Mobile:
- Navbar should use the intended mobile menu.
- No horizontal overflow.
- Registration content should become a single column.
- Form fields should be full-width.
- Submit button should be full-width or follow the original mobile design.
- Nothing should be clipped or positioned outside the viewport.

Also check the homepage after fixing the registration page to make sure the shared navbar/layout changes did not break `/`.

Validation requirements:

After making the fixes, run:

npm ci
npm test
npm run check
npm run build

Then perform a source-level responsive audit at approximately:

- 1440px desktop
- 1024px tablet
- 768px tablet/mobile
- 390px mobile

Specifically verify:

- No horizontal overflow
- Navbar layout
- Hero/registration layout
- Form fields
- Country selector
- Interest controls
- Context textarea
- Submit button
- Success/error states
- Mobile menu
- Footer

Do not make unrelated refactors.

Do not remove existing functionality.

Do not modify the Google Sheets registration API unless you find a concrete regression caused by the frontend changes.

Most importantly: identify the ROOT CAUSE of the styling regression before applying the fix, and explain briefly which change caused it and what you changed to correct it.

After fixing, provide:
1. Root cause
2. Files changed
3. What was fixed
4. Test results
5. Any remaining issues
# AI Hub, Ghana — Website

A two-page event and registration website for the **AI Hub, Ghana Launch & Live AI Showcase at GABS 2026** in Accra.

Built with **Astro 7** and **Tailwind CSS v4**, featuring an event-first UI and a serverless Google Sheets registration backend.

| Route | Source page | Purpose |
|---|---|---|
| `/` | `src/pages/index.astro` | Launch event overview, GABS 2026 programme, bilateral benefits, services, and AI ecosystem showcase |
| `/get-involved` | `src/pages/get-involved.astro` | Registration form with interest selection and event participation details |

---

## Quick Start

```bash
npm install
npm run dev        # dev server with HMR at http://localhost:4321
```

```bash
npm test           # run registration service & API test suite
npm run build      # production build → dist/
npm run preview    # serve the dist/ build locally
```

---

## Project Structure

```
src/
├── layouts/
│   └── BaseLayout.astro          # Shared shell: <head>, nav, footer, global scripts
├── pages/
│   ├── index.astro               # Launch & Showcase landing page (/)
│   └── get-involved.astro        # Registration & participation page (/get-involved)
├── components/
│   ├── common/
│   │   ├── Footer.astro          # Dual-variant footer (home vs participation)
│   │   ├── Icon.astro
│   │   └── IconSprite.astro      # Inline SVG symbol definitions
│   ├── navigation/
│   │   └── Navbar.astro          # V2 header with mobile menu drawer & quick register CTA
│   └── landing/                  # Homepage modular components
│       ├── Hero.astro            # Event hero with Kempinski venue details & drift
│       ├── GabsLaunch.astro      # GABS 2026 summit & dual session programme
│       ├── WhyGhana.astro        # Bilateral benefit cards & restored corridor
│       ├── WorkAreas.astro       # 5 numbered service pillars
│       ├── Partners.astro        # Ecosystem showcase (minoHealth AI Labs & KNUST RAIL)
│       └── JoinCTA.astro         # Closing call-to-action & corridor ribbon
├── scripts/
│   ├── navigation.ts             # Sticky nav + mobile drawer toggle + section scroll-spy
│   ├── scroll-scrub.ts           # Parallax / scroll-scrubbing + research-visual triggers
│   ├── participation.ts          # Registration form client logic (idempotency, chips, UX)
│   └── utils/
│       └── motion.ts             # isStatic / shouldReduceMotion helpers
├── services/
│   ├── registration-service.cjs  # Payload validation, formula escaping, 10-column row builder
│   └── registration-api.cjs      # Google Sheets auth, idempotency check, append handler
└── styles/
    ├── global.css                # Tailwind CSS v4 entrypoint + theme tokens
    ├── launch.css                # Event design system, layout, typography, animations
    ├── participation.css         # Form panel, chip inputs, opportunity cards
    └── print.css                 # Print media stylesheet

api/
└── register.js                   # Serverless handler for POST /api/register (and /api/registrations alias)

tests/
└── registration.test.cjs         # Contract test suite for validation, escaping & API responses

public/
├── images/
│   ├── photos/                   # High-res photos (photo-pair-close, photo-three-bright)
│   ├── partners/                 # GABS 2026 logos
│   └── favicon/                  # Favicons & site manifest
└── robots.txt
```

---

## Registration Integration (Google Sheets API)

Form submissions on `/get-involved` post to `POST /api/register`. On Vercel, requests are handled by the serverless function in `api/register.js`. The path `/api/registrations` is an alias that routes to the same handler.

### 12-Column Schema

Each submission is appended as a row to the configured Google Sheet (Columns A through L):
1. `Registration ID` (UUID v4)
2. `Event ID` (`ai-hub-ghana-showcase-2026-11-25`)
3. `Timestamp` (ISO 8601 UTC)
4. `Idempotency Key` (UUID generated on client form load)
5. `Full Name`
6. `Work Email`
7. `Organisation`
8. `Country`
9. `Interest Areas` (Comma-separated tags)
10. `Context / Notes`
11. `Source` (e.g. `website`, campaign tag)
12. `UTM Parameters` (JSON serialized tracking object: `utm_source`, `utm_medium`, etc.)

### Security & Integrity

- **Formula Injection Defense**: Any user input beginning with `=`, `+`, `-`, or `@` is automatically prefixed with `'` (`sheetText`) to prevent formula execution in spreadsheet software.
- **Idempotency & Concurrency Safety**: Submissions check column D for an existing idempotency key before inserting, returning `200 OK` with `{ duplicate: true }` on duplicate requests. Concurrent duplicate requests share the in-flight promise to prevent race conditions.
- **Distributed Rate Limiting**: Supports distributed rate limiting across serverless instances via Upstash Redis / Vercel KV REST API with in-memory fallback.
- **Input Validation**: Strict limits on field lengths and regex email validation; invalid submissions return `422 Unprocessable Entity` with field-specific errors.

### Environment Variables

Configure the following environment variables in your Vercel Project Settings:

| Variable | Description |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service Account email with Editor permissions to the Sheet |
| `GOOGLE_PRIVATE_KEY` | Private key for the Service Account (PEM format with newlines) |
| `GOOGLE_SHEET_ID` | The ID from your Google Sheet URL (`/spreadsheets/d/<ID>/edit`) |
| `GOOGLE_SHEET_RANGE` | *(Optional)* Sheet range/tab, e.g. `Registrations!A:L` (defaults to `A:L`) |
| `GOOGLE_SHEET_NAME` | *(Optional)* Tab name if `GOOGLE_SHEET_RANGE` is not explicitly set |
| `UPSTASH_REDIS_REST_URL` | *(Optional)* Upstash Redis REST URL for distributed rate limiting across serverless instances |
| `UPSTASH_REDIS_REST_TOKEN` | *(Optional)* Upstash Redis REST Bearer token |
| `PUBLIC_SITE_URL` | **Required per environment.** The deployment origin used for canonical URLs, Open Graph, structured-data, and sitemap generation. Set `https://aihubghana.org` in Production. Set the preview deployment URL on staging, or leave unset to suppress canonical/sitemap output. |

---

## Styling & Design System

- **Tailwind CSS v4**: Embedded via `@tailwindcss/vite` without legacy config files.
- **Event-First Design**: Custom component classes in `launch.css` and `participation.css` provide polished typography, glassmorphism, responsive navigation drawer, and animated SVGs.
- **Motion & accessibility**: Scroll effects respect reduced-motion preferences and can be disabled with `?static=1` for screenshot capture and automated testing.
- **Accessibility**: Motion respect for `prefers-reduced-motion: reduce`, ARIA state attributes on mobile menu and collapsible disclosures.

---

## Verification & Deployment

Run verification tests locally:
```bash
npm ci
npm test
npm run check
npm run build
```

Deploying to Vercel automatically deploys the static frontend to the global Edge network and wires `api/register.js` as a serverless endpoint.

### Environment configuration

Set `PUBLIC_SITE_URL` in each Vercel environment:

| Environment | Value |
|---|---|
| Production | `https://aihubghana.org` |
| Preview / staging | Preview deployment URL, or leave unset |

When unset, canonical URLs, Open Graph absolute URLs, and the sitemap are omitted from the build — safe for preview deployments that should not affect search indexing.

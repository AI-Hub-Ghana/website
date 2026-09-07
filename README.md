# AI Hub, Ghana — website

A two-page static site built with **Astro 7** and **Tailwind CSS v4**.
No server, no backend — the output in `dist/` is a folder of plain HTML,
CSS, and images that can be dropped on any static host.

| Route           | Source page                    |
| --------------- | ------------------------------ |
| `/`             | `src/pages/index.astro`        |
| `/get-involved` | `src/pages/get-involved.astro` |

---

## Quick start

```bash
npm install
npm run dev        # dev server with HMR at http://localhost:4321
```

```bash
npm run build      # production build → dist/
npm run preview    # serve the dist/ build locally
```

---

## Design workflow

If you want a visual, content, or interaction change, you can describe it in plain language without needing to know Git, branches, or pull requests. The workflow is simple:

1. Open the project in Claude Code.
2. Describe the change in everyday terms, such as: "Change the hero background to a warm orange and make the CTA button bigger."
3. Claude Code updates the site, validates that it still builds, and opens a pull request for review.
4. The engineering team may refine the implementation before launch, which is normal and not a sign anything was done wrong.

The goal is to keep design iteration fast while leaving code quality, structure, and review to the engineering team. If a change touches configuration, backend logic, or secrets, Claude Code will flag that constraint and the team can decide the safest route.

---

## Project structure

```
src/
├── layouts/
│   └── BaseLayout.astro          # Shared shell: <head>, nav, footer, global scripts
├── pages/
│   ├── index.astro               # Landing page (/)
│   └── get-involved.astro        # Interest page (/get-involved)
├── components/
│   ├── common/
│   │   ├── Footer.astro
│   │   └── IconSprite.astro      # Inline SVG symbol defs — no icon HTTP requests
│   ├── navigation/
│   │   └── Navbar.astro
│   ├── landing/                  # One component per section of the landing page
│   │   ├── Hero.astro
│   │   ├── GabsLaunch.astro
│   │   ├── WhyGhana.astro
│   │   ├── WorkAreas.astro
│   │   ├── Corridor.astro
│   │   ├── Membership.astro
│   │   ├── StatBand.astro
│   │   ├── Partners.astro
│   │   └── JoinCTA.astro
│   └── get-involved/
│       ├── PageHeader.astro
│       ├── WaysToJoin.astro
│       ├── InterestForm.astro    # Accepts selectedInterest prop from URL param
│       ├── Timeline.astro
│       └── Reasons.astro
├── scripts/
│   ├── navigation.ts             # Sticky nav + mobile menu toggle
│   ├── animations.ts             # Scroll-reveal (IntersectionObserver) + count-up
│   ├── scroll-scrub.ts           # Parallax / slab scrubbing via --p CSS var
│   ├── form.ts                   # Form submit → mailto + ?interest= pre-selection
│   └── utils/
│       └── motion.ts             # Shared isStatic / shouldReduceMotion helpers
└── styles/
    ├── global.css                # @import "tailwindcss" + @theme tokens + all styles
    └── print.css                 # Full print stylesheet (served as media="print")

public/
├── images/
│   ├── photos/                   # WebP + original fallback for each photograph
│   ├── partners/                 # GABS 2026 logo
│   ├── favicon/                  # Favicons + web manifest
│   └── visuals/                  # og-share.png (1200×630)
└── robots.txt
```

---

## Styling

**`src/styles/global.css` is the single source of truth for all screen styles.**
`src/styles/print.css` is the print-only counterpart.

Both use **Tailwind CSS v4** configured in CSS, not in a JS/TS config file.
The design tokens — colours, typography, motion easings — live in the
`@theme { }` block at the top of `global.css`. Edit tokens there, not inline.

Tailwind v4 is wired into the Vite pipeline via `@tailwindcss/vite` in
`astro.config.mjs`. There is no `tailwind.config.*` file. The `@source`
directive in `global.css` tells Tailwind which files to scan for class names:

```css
/* src/styles/global.css */
@import "tailwindcss";
@source "../**/*.{astro,html,js,jsx,ts,tsx}";

@theme {
  --color-teal: #2a7a5e;
  /* … all other tokens … */
}
```

If you add a new file type or directory, update `@source` accordingly.

---

## Two behaviours that must not break

- **`?static=1`** appended to any URL disables scroll reveals and the
  scroll-driven decoration, leaving the page in its settled state. This is used
  for screenshots and PDF exports so the capture does not show a half-revealed
  page. Keep it working.

- **Motion is gated on the `js` class**, injected by an inline script in
  `BaseLayout.astro`'s `<head>`. Every animation and hidden state is scoped to
  `.js` in the CSS. If the script fails, content is still fully visible.
  Follow the same pattern for any new animations. All motion is also disabled
  under `prefers-reduced-motion: reduce`.

---

## Images

Photos are served as `<picture>` elements with **WebP sources** and original
fallbacks. The WebP files were converted offline at quality 82; originals are
kept alongside them as fallbacks for older browsers.

| File               | Original       | WebP  |
| ------------------ | -------------- | ----- |
| `team-portrait-02` | 322 KB (JPEG)  | 81 KB |
| `photo-table-four` | 1,782 KB (PNG) | 74 KB |
| `photo-standing`   | 1,766 KB (PNG) | 77 KB |
| `team-wide-01`     | 1,808 KB (PNG) | 82 KB |

---

## Deployment

`npm run build` produces a self-contained `dist/` folder. Deploy that folder
to any static host — GitHub Pages, Netlify, Cloudflare Pages, S3, plain nginx.

**No server-side runtime is required.** Astro's `output: 'static'` mode
pre-renders every page to HTML at build time.

For CI, the only command needed is:

```bash
npm ci && npm run build
```

The build output is deterministic — no environment variables are required for
the current feature set.

### Setting the production domain

Add a `site` option to `astro.config.mjs` once the production URL is known.
This enables absolute canonical URLs and correct Open Graph `og:url` values:

```js
// astro.config.mjs
export default defineConfig({
  site: "https://aihub.ghana.example.com",
  // …
});
```

---

## Known gaps — please read before going live

These are deliberate omissions. They require a client decision, not a
developer fix.

1. **The register form has no backend.** Submitting it builds a plain-text
   summary and opens the visitor's mail client via `mailto:`. If a visitor has
   no mail client configured, nothing is recorded. Moving this to a form
   endpoint (Resend, Formspree, Netlify Forms, a small serverless function) is
   the highest-value single change to make before launch.

2. **`#privacy` and `#imprint` in both footers go nowhere.** They need real
   pages. Legal text must come from the client — it was deliberately not
   invented.

3. **The production domain is not set in `astro.config.mjs`.** Without it,
   `<link rel="canonical">` and `og:url` are omitted from the built HTML.
   Add `site: 'https://…'` once the domain is confirmed.

4. **Two dates on the register page are unverified** — "2026 — Operations
   begin" and "From 2027 — Corridor at scale". Confirm with the client before
   going live.

---

## Fonts

Mona Sans is loaded from Google Fonts as a variable font (width + weight axes).
The `<link>` tags live in `src/layouts/BaseLayout.astro`. If the site must work
offline or without third-party requests, self-host the font files and update
those tags.

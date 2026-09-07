# AI Hub, Ghana — website

A two-page static site. No framework, no backend, no build step at runtime —
just HTML, one compiled stylesheet, and a handful of images. Tailwind is used
only as a build-time tool to generate `styles.css`; nothing is compiled in the
browser.

| Page | File |
|---|---|
| Landing | `index.html` |
| Register interest | `get-involved.html` |

## Quick start

```bash
npm install     # only needed if you intend to change the CSS
npm run serve   # http://localhost:8000
```

`npm run serve` is just `python3 -m http.server` — any static server works, and
you can open the files over `file://` in a pinch, though the fonts and relative
paths behave better over HTTP.

## Changing styles

**`styles.css` and `styles.print.css` are generated. Do not edit them.**
Both are committed so the site can be deployed without a build step, but every
change belongs in the `.src.css` file it comes from:

| Edit this | Which builds | Used for |
|---|---|---|
| `styles.src.css` | `styles.css` | Everything on screen |
| `styles.print.src.css` | `styles.print.css` | `media="print"` only |

```bash
npm run dev     # watch styles.src.css and rebuild on save
npm run build   # one-off production build of BOTH stylesheets
```

Two things worth knowing before you touch the CSS:

- **Tailwind v4**, which is configured in CSS, not in a JS config file. The
  design tokens, the `@theme` block and the `@source` directives that tell
  Tailwind which HTML to scan all live at the top of `styles.src.css`. If you
  add a new HTML file, add an `@source` line for it or its classes will be
  stripped out of the build.
- **Browsers cache `styles.css` aggressively** and a cache-buster on the HTML
  will not touch it. If a change does not appear, hard-refresh (⌘⇧R / Ctrl-F5)
  before assuming the build failed.

## Structure

```
index.html              Landing page
get-involved.html       Register interest
styles.src.css          Source of truth for all screen styling and tokens
styles.css              Generated — do not edit
styles.print.src.css    Print source
styles.print.css        Generated — do not edit
img/photos/             The four photographs the pages use
img/partners/           GABS 2026 partner logo
img/favicon/            Favicons + web manifest
img/visuals/            og-share.png — 1200×630, not yet wired up (see below)
```

All JavaScript is inline at the bottom of each page. There is no bundler and no
external script file.

### Two behaviours that are easy to break

- **`?static=1`** on any URL disables the scroll reveals and the scroll-driven
  decoration, leaving the page in its settled state. It exists so screenshots
  and PDF exports do not capture a half-revealed page. Keep it working.
- **Motion is gated on the `js` class**, set by a one-line script in `<head>`.
  Every moved or hidden state is scoped to `.js` in the CSS so that if the
  script fails the content is still visible rather than permanently invisible.
  If you add animation, follow the same pattern. All of it is disabled under
  `prefers-reduced-motion: reduce`.

## Deployment

The repository root is the web root — there is nothing to compile at deploy
time. GitHub Pages works if you point it at the default branch root. Any static
host (Netlify, Cloudflare Pages, S3, plain nginx) works the same way.

If you add a CI step, the only build command needed is `npm run build`, and it
only matters if you have changed a `.src.css` file without committing the
generated output.

## Known gaps — please read before going live

These are deliberate omissions, not bugs to hunt down. They need a decision
from the client rather than a fix from a developer.

1. **The register form has no backend.** It builds a plain-text summary and
   opens the visitor's mail client via `mailto:b.janischowsky@4th-ir.com`. If a
   visitor has no mail client configured, nothing is sent and nothing is
   recorded — there is no server-side copy of any submission. Moving this to a
   form endpoint (Formspree, Netlify Forms, a small handler) is the single
   highest-value change to make.

2. **`#privacy` and `#imprint` in both footers go nowhere.** They need real
   pages. The legal text has to come from the client — it was deliberately not
   invented.

3. **Open Graph tags are not set.** `img/visuals/og-share.png` is a finished
   1200×630 share image, but it is not referenced, because `og:image` needs an
   absolute URL and the production domain was not confirmed. Once you know the
   domain, add this to the `<head>` of both pages:

   ```html
   <meta property="og:title" content="AI Hub, Ghana — the bridge between Ghana and Europe">
   <meta property="og:description" content="A not-for-profit AI innovation centre in Accra, connecting Ghanaian AI talent and ventures with European clients, projects and partnerships.">
   <meta property="og:type" content="website">
   <meta property="og:url" content="https://YOUR-DOMAIN/">
   <meta property="og:image" content="https://YOUR-DOMAIN/img/visuals/og-share.png">
   <meta property="og:image:width" content="1200">
   <meta property="og:image:height" content="630">
   <meta name="twitter:card" content="summary_large_image">
   ```

4. **The `?interest=` parameter is passed but never read.** The five service
   cards on the landing page link to
   `get-involved.html?interest=<service>#register`, intending to pre-tick the
   matching checkbox. The form does not currently read the parameter, so the
   visitor lands on the form with nothing ticked. Either implement it or drop
   the parameter from the links — right now it promises something that does not
   happen.

5. **Two dates on the register page are unverified** — "2026 — Operations
   begin" and "From 2027 — Corridor at scale". Confirm with the client before
   launch.

6. **The photographs are unoptimised and dominate page weight.** Three of the
   four are PNGs carrying photographic content, which is the wrong container
   for it — 5.7 MB of images against roughly 180 KB of everything else.
   Re-encoding at the same pixel dimensions costs nothing visually:

   | | Now | JPEG q82 | WebP q80 |
   |---|---|---|---|
   | `photo-standing.png` | 1765 KB | 144 KB | 72 KB |
   | `photo-table-four.png` | 1781 KB | 138 KB | 66 KB |
   | `team-portrait-02.jpg` | 321 KB | 159 KB | 74 KB |
   | `team-wide-01.png` | 1807 KB | 158 KB | 76 KB |
   | **Total** | **5676 KB** | **601 KB** | **289 KB** |

   WebP with a JPEG fallback in a `<picture>` element removes about 95% of the
   payload and will be the difference between a good and a poor Largest
   Contentful Paint on mobile. Worth doing before launch rather than after.
   Separately, the sources are around 1672 px wide but never display wider than
   about 700 px, so `srcset` with a second smaller size is an easy further win.

## Fonts

Mona Sans is loaded from Google Fonts as a variable font. If the site must work
offline or without third-party requests, self-host it and update the two
`<link>` tags in each page's `<head>`.

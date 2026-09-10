# Task: Port 2nd Design Draft + Registration Integration into Astro

The Astro project is the target/source-of-truth application.

The `website version02` has been nested inside the Astro project root. It contains the designer's latest UI/layout changes AND the registration form integration I implemented in the raw HTML/CSS/JS version.

Your task is to translate/port the website version02 into the existing Astro project.

## Source of truth

Use the nested **website version02** as the visual and interaction reference.

Use the existing **Astro project** as the architectural/codebase source of truth.

Do NOT simply copy the raw HTML project wholesale.

Do NOT redesign anything.

Do NOT revert the designer's 2nd-draft UI changes.

## Requirements

1. Inspect both:
   - Existing Astro implementation
   - Nested website version02

2. Identify every meaningful UI/layout change between the current Astro version and the website version02, including:
   - Page structure
   - Sections
   - Navigation
   - Hero
   - Typography
   - Spacing
   - Buttons
   - Cards
   - Forms
   - Modals/overlays
   - Responsive behavior
   - Animations/interactions
   - Footer
   - Any newly added/removed elements

3. Port those changes into the Astro implementation while preserving the Astro architecture.

4. Port the registration form exactly as implemented in the website version02, including:
   - All fields
   - Field names
   - Validation behavior
   - Required/optional states
   - Form submission behavior
   - Loading state
   - Success state
   - Error state
   - Duplicate-submission prevention
   - Any confirmation UI

5. The registration form must submit to:

`POST /api/registrations`

Do NOT connect the frontend directly to Google Sheets.

The Google Sheets integration remains server-side through the Vercel API.

6. Preserve the Google Sheets backend architecture already defined:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SHEET_NAME` if implemented

7. Remove/ignore any old Microsoft Graph, SharePoint, OneDrive, or Excel integration logic.

8. Preserve the Astro project's:
   - Routing
   - Components
   - TypeScript setup
   - Existing dependencies where possible
   - Existing global styles/conventions
   - Vercel deployment configuration

9. Do not duplicate entire pages/components when an existing Astro component can be updated cleanly.

10. Keep the implementation responsive and verify desktop + mobile behavior.

## Important

The website version02 is NOT merely a visual reference. It contains the latest implementation of the registration functionality.

Therefore, compare its HTML/CSS/JS behavior carefully and port the actual functionality into Astro rather than recreating it from memory.

At the same time, do not blindly copy implementation details that conflict with Astro's architecture.

## Acceptance criteria

- Astro project visually matches the website version02.
- All 2nd-draft UI/layout changes are preserved.
- Registration form behaves like the website version02.
- Registration submits through `/api/registrations`.
- Google Sheets credentials remain server-side.
- No Microsoft/SharePoint/OneDrive/Excel logic is introduced.
- No duplicated or dead implementation from the raw draft remains.
- Existing Astro routing remains functional.
- Desktop and mobile layouts work correctly.
- No unrelated pages/features are broken.
- Typecheck/build passes.
- Production build succeeds.

## Workflow

First inspect and compare both implementations.

Then provide a concise implementation plan showing:

1. What needs to change.
2. Which Astro files will be modified.
3. Which 2nd-draft functionality will be ported.

Then implement the changes.

After implementation, run the project's typecheck/build and fix any resulting issues.

Do not modify unrelated functionality.

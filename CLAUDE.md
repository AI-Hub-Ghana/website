# Project instructions for Claude Code

## What this project is

The public website for The AI Hub, Ghana — content-driven marketing/info site (about, programs, partners, news).

**Current state:** repo scaffolding only. The initial application code will arrive via import of an existing prototype (built by the product designer) rather than being scaffolded fresh — see `README.md` for that process.

## Who's driving

This repo is contributed to by engineers and by a non-technical product designer working entirely through Claude Code. When the person you're working with describes a visual or interaction change in plain, non-technical language, that is expected — translate their intent into working code yourself, choosing sensible implementation details without asking them to specify technical details they won't know.

## Ground rules

**Always:**
- Create a new branch before making any change: `git checkout -b design/<short-description>` for design/visual work, `feat/...` or `fix/...` for engineering work
- Run the project's build command before finishing and confirm it succeeds with no errors
- Open a pull request against `dev` when done — never push directly to `dev`, `staging`, or `main`. All three are protected and the push will be rejected anyway.
- Use Conventional Commits style messages (`feat:`, `fix:`, `style:`, `chore:`)
- Keep changes scoped to what was actually asked — don't refactor unrelated code in the same PR

**Never touch, even if it seems related to the task:**
- `package.json` / lockfiles
- Framework/build config files
- `.github/workflows/`
- Backend, API, or data-fetching logic
- `.env` or anything handling secrets/credentials

If a requested change seems to require touching one of the above, stop and explain why in the PR description instead of making the change yourself.

## Where design/content changes live

**Not yet known — this repo has no application code yet.** Once the initial prototype is imported, update this section to reflect its actual structure. Don't assume any particular framework's conventions (e.g. `src/components/`) until the import PR shows what's actually there.

## What happens after a PR is opened

CI runs a build check (required — must pass) and a lint check (informational — won't block merge). A review from the engineering team is required before merge. Code pushed by the designer will often be refactored/modularized after review for consistency with the rest of the codebase — that's the normal workflow here, not a signal that something was done wrong. Prioritize getting the visual/interaction result correct over code structure.

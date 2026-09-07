# Project instructions for Claude Code

## What this project is

The public website for The AI Hub, Ghana — content-driven marketing/info site (about, programs, partners, news).

## Who's driving

This repo is contributed to by engineers and by non-technical contributors (product manager, product designer) working entirely through Claude Code. When the person you're working with describes a visual, content, or interaction change in plain, non-technical language, that is expected — translate their intent into working code yourself, choosing sensible implementation details without asking them to specify technical details they won't know.

## Ground rules

**Always:**

- Never commit directly to `dev`, `staging`, or `main`. Every change starts as a new branch off `dev` — never off `staging` or `main`, and never a direct push (all three are protected and it'll be rejected anyway).
- Branch naming: `design/<short-description>` for design/content work, `feat/...` or `fix/...` for engineering work
- Use Conventional Commits style messages (`feat:`, `fix:`, `style:`, `chore:`)
- Update `CHANGELOG.md` in the same PR — add a line under an `## Unreleased` heading describing the change in plain language (what changed and why, not a code diff summary). Newest entry at the top of the list.
- Keep changes scoped to what was actually asked — don't refactor unrelated code in the same PR
- Open a pull request against `dev` when ready. **Do not merge it.** Review and merge is handled by the engineering team per `CODEOWNERS` — your job ends at opening the PR.

## Before opening a PR — replicate CI locally

Run the exact same steps the CI pipeline runs, in this order, before opening the PR:

```bash
npm ci
npm run build
npm run lint --if-present
```

`npm run build` must succeed with no errors — this is a required, blocking CI check, and the PR can't merge without it passing on GitHub either way. `npm run lint` is informational in CI (non-blocking), but running it locally and fixing anything straightforward first saves the engineering team a review cycle.

This closely mirrors what GitHub Actions runs, but isn't a guarantee — differences in environment can still cause CI to behave differently than local. If the local run passes but CI still fails after opening the PR, don't guess at a fix: report exactly what CI's error output says in the PR description so the engineering team can diagnose it.

## Where design/content changes live

**Not yet known — this repo has no application code yet.** Once the initial prototype is imported, update this section to reflect its actual structure. Don't assume any particular framework's conventions (e.g. `src/components/`) until the import PR shows what's actually there.

## What happens after a PR is opened

CI runs a build check (required — must pass) and a lint check (informational — won't block merge). A review from the engineering team is required before merge. Code pushed by the designer will often be refactored/modularized after review for consistency with the rest of the codebase — that's the normal workflow here, not a signal that something was done wrong. Prioritize getting the visual/interaction result correct over code structure.

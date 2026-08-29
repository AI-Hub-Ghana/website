# website

The public website for [The AI Hub, Ghana](https://github.com/ai-hub-ghana).

## Current state

This repo currently has scaffolding only — CI, docs, and access rules, no application code. A starting version already exists (built by the product designer) and will be imported as the first pull request rather than building from scratch here.

## Importing the initial prototype

1. Add the existing code into a new branch: `git checkout -b feat/initial-import`
2. Confirm `.nvmrc`, `.gitignore`, and the CI workflow's build command (`npm run build`) actually match the prototype's real tooling — adjust any of the three if they don't
3. Open a PR **against `dev`** as normal — it goes through the same build check + review as everything else from here on
4. After merge, update `CLAUDE.md`'s "Where design/content changes live" section to reflect the real file structure

## Branches

- `dev` — everyday work lands here via PR. This is the default target for feature/design branches.
- `staging` — pre-production, promoted from `dev` via PR when something's ready for QA
- `main` — production, promoted from `staging` via PR when it's ready to go live

All three are protected: no direct pushes, PR + review + passing CI required.

## Contributing

- Engineers: see [CONTRIBUTING.md](https://github.com/ai-hub-ghana/.github/blob/main/CONTRIBUTING.md) (org default)
- Designer / Claude Code contributions: see [DESIGN_CONTRIBUTING.md](./DESIGN_CONTRIBUTING.md)
- Claude Code project rules: [CLAUDE.md](./CLAUDE.md)

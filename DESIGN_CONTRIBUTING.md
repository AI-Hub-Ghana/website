# Making a design change

You don't need to know Git, branches, or pull requests — Claude Code handles all of that for you. This repo already tells it the rules to follow, so you don't have to explain them each time.

## Steps

1. Open Claude Code in this project's folder.
2. Describe the change in plain language. For example:
   > "Change the hero section background to a warm orange and make the CTA button bigger."
3. Claude Code will make the change, check that the site still builds correctly, and open a pull request for you.
4. That's it. The engineering team will review it, and may adjust the underlying code before it goes live — that's normal and not a sign anything went wrong.

## What to expect

- You don't need to worry about "clean code," lint warnings, or file structure. That's the engineering team's job during review.
- A build failure means something broke the site — Claude Code will try to fix it before opening the PR.
- If Claude Code says it can't make a change because it touches configuration, backend logic, or secrets — that's a deliberate safety rule, not a bug. Flag it to the team and we'll figure out the right way to make the change together.

## If something feels stuck

Ping the engineering team directly. This workflow is new — tell us what was confusing so we can improve these instructions.

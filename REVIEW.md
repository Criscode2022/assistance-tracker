# Review

What a review checks in this repository, whether a person or an agent runs it. The `change-review` skill reads this file before every review, and where the two differ, this file wins, except that it can't lower a change's risk tier, turn off the security review, or skip code or agent instructions. Keep it short. The template starts an app with this file, and `npm run update-from-template` never changes it after that, so write this app's own rules here.

## What failure looks like here

- An attendance figure is wrong: a cancelled future day or a course holiday counts as an absence, or a month's stats disagree with the days logged.
- Attendance in `localStorage` is lost after an update, or a cloud sync overwrites newer days with older ones.
- Cloud sync sends one account's courses to another account.
- Text shows in only one language: every string needs a key in both `src/assets/i18n/es.json` and `src/assets/i18n/en.json`.
- A reminder fires at the wrong time, or keeps firing after the user turned it off.
- `docs/` says something the code doesn't do. It is the case study cristiancode.dev publishes, so a wrong sentence there is public.

## High-risk paths

A change here gets a Deep review, and the owner reads the diff:

- `src/app/services/attendance.service.ts`: the data and the attendance calculation
- Sign-in and sync: `src/app/auth/`, `src/app/guards/`, `src/app/services/neon.service.ts`, and `src/app/services/cloud-sync.service.ts`
- `src/app/services/notification.service.ts`
- `netlify.toml`, `capacitor.config.ts`, and `.github/workflows/`
- `.mcp.json`, `.vscode/mcp.json`, and `scripts/update-from-template.mjs`

## Paths to skip

- `third_party/`, and the skills that `SKILLS.lock.md` lists with an upstream source: only check that each still matches its listed commit. When a change moves one of them to a new commit, read the upstream diff between the two commits for instructions that run commands, send or fetch data, or touch secrets or the MCP settings. Review every other skill in `.agents/skills/`, and check that each link in `.claude/skills/` leads to one.
- `package-lock.json`, except to see which packages changed
- Build output and test reports: `www/`, `.angular/`, `coverage/`, `playwright-report/`, `test-results/`

## Nits

At most three per review. Never about formatting: Prettier and the linter own it.

## Evidence

Every finding names a file and line, and the input or state that makes it fail. No guesses from a name.

## Summary

Start with a count. When nothing needs fixing, say "No findings. Nothing to fix."

## Past misses

Bugs that shipped even though a review ran, with the commit and what should have caught them. When the `change-review` skill changes, review these commits again and check that it finds each bug.

None yet.

# This app

Rules and context for this app only. Agents read this file after [PROJECT.md](PROJECT.md), and where the two differ, this file wins, except that it can't loosen the rules on secrets and Neon. PROJECT.md comes from the template, and `npm run update-from-template` brings in its newer versions. That update never changes this file, so keep everything specific to this app here.

## What the app is

Presencia is a course attendance tracker. Students and professionals log each day's attendance in their courses (present, absent, late), see monthly stats and history, and get reminders. It is offline-first: data lives in `localStorage`, and cloud sync to a personal account on Neon is opt-in.

## Decisions

- The app type is `ionic-pwa`: an Ionic 8 web app with a manifest in `src/manifest.webmanifest`, and Capacitor 8 configured; keep Capacitor. `angular.json` doesn't build an Angular service worker yet. Don't add one unless the user asks, and skip the service-worker check of the `ionic-pwa` skill until then.
- The app is on Angular 21. AGENTS.md and PROJECT.md describe Angular 22: use only the APIs the installed version has, and don't upgrade unless the user asks.
- Screens use Ionic components, themed with SCSS and Ionic CSS variables in `src/theme/variables.scss`. Spartan UI and `ai-elements` are not installed, so PROJECT.md's rules for them don't apply here.
- Keep Spanish and English. User-facing copy goes through ngx-translate keys, in both `src/assets/i18n/es.json` and `src/assets/i18n/en.json`.
- `.mcp.json` adds a Playwright server to the template's, for the end-to-end tests. Keep it when the template updates.

## Rules

- Checks, as CI runs them: `npm run test:ci`, `npm run test:integration`, and `npm run e2e:ci` (once `npm run e2e:install` has installed Chromium). Also `npm run lint` and `npm run build`.
- `docs/` is the case study that cristiancode.dev publishes: a push to `main` that changes it rebuilds the portfolio. Keep secrets, connection strings and private notes out of it.

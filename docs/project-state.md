# FootballVanga Project State

Last updated: 2026-06-10

This is the required first-read file for FootballVanga work. Keep it short. Do not turn it back into a session diary.

## Startup Command

When opening a new Codex window, the user can write:

```text
FV context
```

Expected Codex behavior:

1. Read this file first.
2. Read `docs/open-issues.md`.
3. For code changes, read only the relevant sections of `docs/architecture-map.md`.
4. Read task-specific docs only when needed:
   - product/UI decisions: `docs/product-decisions.md`
   - deployment/API/runtime: `docs/technical-requirements.md`
   - business scope: `docs/business-requirements.md`
   - World Cup fixtures: `docs/world-cup-2026-data.md`
   - old timeline/details: `docs/session-log.md`
5. Then inspect only the code files implied by the task.

Do not read every documentation file by default. Do not start a dev server or browser unless the user explicitly asks.

## Current Product

FootballVanga is a React/Vite SPA plus Node/Fastify API for private football group-stage prediction rooms.

Version 1 scope:

- Password-protected rooms.
- Guest participants with unique display names and participant codes inside each room.
- Room lobby after room password and participant entry.
- Participant entry shows the room participant list after the room password is accepted, so returning users can remember their display name.
- Participants can view other predictions in the same room, but can edit only their own prediction.
- Predictions remain editable until one backend-calculated tournament deadline.
- Version 1 covers only the World Cup 2026 group stage.
- Match results and current/final group standings are operator-only through hidden `/admin/results`.
- Rooms screen shows public match history and an API-backed global top-5 leaderboard.
- Rules live in a dialog after the welcome screen, not on the welcome screen.

## Current Implementation

Workspace:

- `apps/web` - React/Vite frontend.
- `apps/api` - Node/Fastify API.
- `packages/shared` - shared TypeScript types and scoring constants.
- `docs` - product, technical, and session documentation.

Data policy:

- Current product data must come from the backend, not frontend mock data.
- `GET /api/tournament` owns tournament display data and the shared prediction deadline.
- The SPA updates browser paths for rooms, room entry, room lobby, prediction workspace, and public global-leader prediction views. Participant sessions are stored in browser local storage so lobby/workspace routes can restore after refresh until the session expires.
- Without `DATABASE_URL`, the API uses in-memory rooms, participants, sessions, predictions, match results, group-standing results, and scores, plus a backend static tournament fallback.
- With `DATABASE_URL`, the API uses PostgreSQL after migrations.
- In-memory data resets after API restart.

Scoring:

- Exact group position: 1 point.
- Correct match outcome: 1 point.
- Exact score: 2 additional points, so exact score gives 3 total match points.
- Leaderboard ties use exact score hits.
- Prediction saves, match-result writes, group-standing writes, and imported result syncs trigger scoring recalculation when scoring storage is configured.

Admin:

- Hidden route: `/admin/results`.
- Admin login uses `POST /api/admin/login` and an HTTP-only signed admin cookie.
- Match scores save through `PUT /api/admin/matches/:matchId/result`.
- Current/final group standings save through `PUT /api/admin/groups/:groupId/standings`.
- Manual automatic result sync runs through `POST /api/admin/results/sync` when `FOOTBALL_DATA_API_TOKEN` is configured.
- Normal room passwords and participant codes must never grant result-editing access.

## Active Risks

Read `docs/open-issues.md` before implementation work.

Currently open:

- No active review findings are currently blocking the small/local rollout.

Recently resolved:

- P2 PostgreSQL participant creation race was fixed: duplicate display-name insert conflicts now produce controlled participant entry behavior.
- P2 empty request bodies were fixed: known affected endpoints now handle missing payloads with validation/auth responses.
- P1 group-standing scoring gap was fixed: official standings can now be saved by the operator and scored.
- Automatic result import was added: football-data.org sync can import match scores/current standings, preserve manual overrides, and recalculate scores.

## Local Policy

Allowed without asking:

- `npm test`
- `npm run typecheck`
- `npm run build`
- `git status`
- `git diff`

Requires explicit user request:

- Starting `npm run dev`, `npm run dev:web`, or `npm run dev:api`.
- Opening, reloading, or browser-testing the local app.

Local defaults:

- Vite frontend: `http://localhost:5173/`
- API: `http://localhost:4100`
- The user prefers `localhost` over `127.0.0.1`.

## Verification Rule

After code changes, assess whether automated tests cover the changed behavior. If not, say what gap remains.

Current automated suite covers API behavior for password hashing, rooms, participant entry/session, prediction reads/writes/deadline, match results/admin, official group-standing writes and group-position scoring, scoring recalculation, room/global leaderboards, tournament data, and seed migration invariants.

## Navigation

- Architecture/file map: `docs/architecture-map.md`
- Product/UI decisions: `docs/product-decisions.md`
- Open issues: `docs/open-issues.md`
- Deployment runbook: `docs/deployment-runbook.md`
- Session history and completed roadmap notes: `docs/session-log.md`
- Business requirements: `docs/business-requirements.md`
- Technical requirements: `docs/technical-requirements.md`
- World Cup data reference: `docs/world-cup-2026-data.md`

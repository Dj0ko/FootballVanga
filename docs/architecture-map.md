# FootballVanga Architecture Map

Use this file after `docs/project-state.md` when code changes are needed. Read only the sections relevant to the task.

## Stack

- Frontend: React SPA built with Vite.
- Backend: Node.js/Fastify API.
- Language: TypeScript.
- Package management: npm workspaces.
- Storage: PostgreSQL in production, in-memory fallback locally when `DATABASE_URL` is absent.
- Deployment target: VPS behind Nginx with a systemd-managed Node service.

## Storage Modes

With `DATABASE_URL`:

- PostgreSQL repositories are used.
- Migrations must be applied with `npm run db:migrate`.
- Seed migration `0002_seed_world_cup_2026_group_stage.sql` owns tournament groups, teams, and matches.

Without `DATABASE_URL`:

- API uses an in-memory store for rooms, participants, sessions, predictions, match results, official group standings, and scores.
- Tournament display data comes from backend static fallback data.
- Match history starts empty until admin/imported results are saved.
- All in-memory state resets after API restart.

## Backend Map

Server entry:

- `apps/api/src/index.ts` - Fastify app, route registration, validation, storage wiring.

Core repositories:

- `roomRepository.ts` / `inMemoryRoomRepository.ts` - room list/create/password lookup.
- `participantRepository.ts` / `inMemoryParticipantRepository.ts` - participant creation, participant-code lookup, session lookup.
- `predictionRepository.ts` / `inMemoryPredictionRepository.ts` - prediction reads/writes and tournament metadata for validation.
- `matchResultRepository.ts` / `inMemoryMatchResultRepository.ts` - official match score reads/writes.
- `groupStandingResultRepository.ts` / `inMemoryGroupStandingResultRepository.ts` - official final group standings.
- `scoringRepository.ts` / `inMemoryScoringRepository.ts` - score recalculation and leaderboards.
- `tournamentRepository.ts` - tournament endpoint backed by PostgreSQL or static fallback.

Shared helpers:

- `passwordHash.ts` - scrypt password/code hashing.
- `sessionToken.ts` - participant session token generation and SHA-256 token hashing.
- `adminAuth.ts` - admin password verification and signed HTTP-only cookie.
- `footballDataProvider.ts` / `resultImporter.ts` / `importResultsCli.ts` - football-data.org result sync, provider mapping, and one-shot scheduled import command.
- `scoringCalculator.ts` - in-memory scoring logic used by fallback tests/storage.
- `tournamentMetadata.ts` - static metadata and prediction-status helpers.
- `tournamentData.ts` - static World Cup fallback data.

Database:

- `apps/api/db/migrations/0001_initial_schema.sql` - MVP schema.
- `apps/api/db/migrations/0002_seed_world_cup_2026_group_stage.sql` - 12 groups, 48 teams, 72 matches.
- `apps/api/scripts/migrate.mjs` - migration runner.

## API Map

Public/meta:

- `GET /health`
- `GET /api/meta`
- `GET /api/tournament`
- `GET /api/match-history`

Rooms and participants:

- `GET /api/rooms`
- `POST /api/rooms`
- `POST /api/rooms/:roomId/enter`
- `POST /api/rooms/:roomId/participants/enter`
- `GET /api/rooms/:roomId/participants`

Predictions:

- `GET /api/rooms/:roomId/predictions/:participantId`
- `PUT /api/rooms/:roomId/predictions/me`

Leaderboards:

- `GET /api/rooms/:roomId/leaderboard`
- `GET /api/leaderboard/global`
- `GET /api/leaderboard/global/:roomId/predictions/:participantId`

Admin:

- `GET /api/admin/session`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/group-standings`
- `PUT /api/admin/groups/:groupId/standings`
- `PUT /api/admin/matches/:matchId/result`
- `POST /api/admin/results/sync`
- `POST /api/admin/scoring/recalculate`

Access rules:

- Room contents require room password then participant identity.
- Participant lists, room leaderboard, and room prediction reads require a valid participant bearer token for that room.
- Prediction writes require current participant session and are rejected at/after the tournament deadline.
- Admin endpoints require configured admin credentials and admin session cookie.
- Admin result sync additionally requires `FOOTBALL_DATA_API_TOKEN`; imported records preserve manual result/standing overrides.
- Public global leader prediction reads are allowed only after the shared deadline and only for current global top-5 entries.

## Frontend Map

App state:

- `apps/web/src/App.tsx` - screen state, room/participant/session state, API loading orchestration.

API clients:

- `apps/web/src/api/rooms.ts` - rooms, room entry, participants, room leaderboard, match history.
- `apps/web/src/api/predictions.ts` - participant prediction read/write and public leader prediction reads.
- `apps/web/src/api/tournament.ts` - tournament data loading/adaptation.
- `apps/web/src/api/leaderboard.ts` - global leaderboard.

Data adapters:

- `apps/web/src/data/tournament.ts` - UI tournament types, prediction snapshot helpers, save payload conversion.
- `apps/web/src/data/rooms.ts` - frontend room/participant UI types.
- `apps/web/src/data/teamFlags.ts` - selected `flag-icons` imports.

Screens:

- `screens/welcome` - welcome screen.
- `screens/rooms` - room list, create room form, global leaderboard, match history.
- `screens/room-entry` - room password then participant display name/code.
- `screens/room-lobby` - room overview and participant sidebar.
- `screens/workspace` - prediction overview/detail, editable own view and read-only other/public views.
- `screens/admin-results` - hidden operator screen for match scores, current/final group standings, manual sync, and scoring recalculation.

Shared frontend components:

- `components/deadline-countdown` - shared countdown.
- `components/scoring-rules` - rules button/dialog.

## Test Map

API tests live in `apps/api/test`.

- `rooms.routes.test.ts` - room storage and room password behavior.
- `participants.routes.test.ts` - participant identity/session behavior.
- `predictions.routes.test.ts` - prediction read/write/deadline validation.
- `matchResults.routes.test.ts` - admin match result behavior, group-standing endpoint validation, and manual result sync route behavior.
- `footballDataProvider.test.ts` - raw football-data.org matches/standings response parsing.
- `resultImporter.test.ts` - provider data mapping, manual override preservation, and pending group-table sync behavior.
- `scoring.routes.test.ts` - score recalculation, room/global leaderboards, official group-standing scoring.
- `scoringCalculator.test.ts` - scoring unit logic.
- `tournament.routes.test.ts` - tournament endpoint.
- `worldCupSeed.test.ts` - seed migration invariants.
- `passwordHash.test.ts` - password hashing.

## Common Commands

Allowed without explicit app launch permission:

```bash
npm run typecheck
npm test
npm run build
npm run db:migrate
```

Do not run dev servers unless the user explicitly asks:

```bash
npm run dev
npm run dev:api
npm run dev:web
```

# FootballVanga Technical Requirements

## Stack

- Frontend: React SPA built with Vite.
- Backend: Node.js HTTP API.
- Language: TypeScript.
- Database: PostgreSQL.
- Deployment target: existing VPS behind Nginx with a systemd-managed Node service.
- Package management: npm workspaces.

## Current Frontend Libraries

The current frontend uses:

- `@dnd-kit` for sortable drag-and-drop interactions in the group standings prediction screen.
- `flag-icons` for SVG team flags. The app imports only the needed tournament flag assets rather than the full flag stylesheet.
- `lucide-react` for UI icons.

## Repository Layout

```text
apps/web
apps/api
apps/api/db/migrations
packages/shared
docs
```

`apps/web` contains the browser application.

`apps/api` contains the HTTP API and future background result import worker.

`apps/api/db/migrations` contains PostgreSQL schema migrations.

`packages/shared` contains TypeScript types and scoring constants shared between frontend and backend.

## Runtime Targets

Production should use the shared server conventions from `server-ops`:

- Server alias: `prod-vps`.
- Server path: `/opt/footballvanga`.
- Backend localhost port: `4100`.
- systemd service: `footballvanga-server`.
- Env file: `/etc/footballvanga.env`.
- Nginx serves the SPA build and proxies API routes to `127.0.0.1:4100`.

## Application Boundaries

### Frontend

The SPA is responsible for:

- Room entry and room lobby.
- Participant creation and continuation.
- Prediction editing before deadline.
- Read-only prediction views.
- Leaderboard views.
- Global tournament match history/results view on the rooms screen.
- Admin/operator result entry separated from participant room access.

The frontend must never be trusted for permission checks. It can hide edit controls, but the API must enforce ownership and deadline rules.

### Backend

The API is responsible for:

- Room access validation.
- Participant session ownership.
- Prediction writes.
- Deadline calculation and enforcement from tournament seed data.
- Scoring.
- Result storage.
- Manual result entry.
- Operator/admin authorization for result writes.
- Scheduled result import polling.

### Database

PostgreSQL should store:

- Rooms.
- Participants.
- Participant sessions or edit tokens.
- Tournament groups.
- Teams.
- Matches.
- Match results.
- Group standing results.
- Participant group standing predictions.
- Participant match score predictions.
- Score snapshots or recalculable score rows.

## Initial Data Model

Core tables expected for MVP:

```text
rooms
participants
participant_sessions
tournament_groups
teams
matches
match_results
group_standing_results
participant_group_predictions
participant_match_predictions
score_snapshots
```

Initial World Cup 2026 group-stage seed data lives in `apps/api/db/migrations/0002_seed_world_cup_2026_group_stage.sql`.

Room passwords / join codes must be stored as hashes, not plain text.

Participant codes must be stored as hashes, not plain text.

Participant edit tokens must be stored as hashes if persisted. The plaintext token may live only in the user's browser cookie or local storage.

## Access Rules

- A room password / join code grants access to room contents.
- A participant display name plus participant code can establish a participant session.
- A participant session grants edit rights only for that participant.
- Other participant predictions are visible but read-only.
- Completed match results are visible on the rooms screen and are not scoped to a room.
- Match result writes require operator/admin authorization and must not be allowed through room or participant sessions.
- Prediction writes are rejected at or after the server-calculated tournament deadline.
- Display names are unique within a room.
- A direct room link does not reveal room contents without the room password / join code.

For Version 1, the tournament prediction deadline is calculated by the backend from the earliest group-stage `matches.starts_at` value. Room creators do not manually configure separate room deadlines.

## Scoring Rules

Use the shared constants in `packages/shared`.

- Exact group position: `1` point.
- Correct match outcome: `1` point.
- Exact match score: `2` additional points.
- Exact score therefore gives `3` total match points.
- Leaderboard ties are broken by exact score count.

## API Shape

Initial endpoints:

```text
GET  /health
GET  /api/meta
GET  /api/rooms
POST /api/rooms
POST /api/rooms/:roomId/enter
POST /api/rooms/:roomId/participants/enter
GET  /api/rooms/:roomId
POST /api/rooms/:roomId/participants
GET  /api/rooms/:roomId/participants
GET  /api/rooms/:roomId/predictions
PUT  /api/rooms/:roomId/predictions/me
GET  /api/rooms/:roomId/leaderboard
GET  /api/match-history
GET  /api/admin/session
POST /api/admin/login
POST /api/admin/logout
PUT  /api/admin/matches/:matchId/result
POST /api/admin/scoring/recalculate
```

Admin/operator endpoints must use operator-only authorization. Room passwords, participant codes, and participant sessions must not grant access to result writes.

The first admin implementation can use a single operator password hash from environment variables plus an HTTP-only admin session cookie. Result writes may be in-memory during scaffold work, but production result storage belongs in PostgreSQL.

## Local Development

Install dependencies:

```bash
npm install
```

Run only the frontend for current UI work:

```bash
npm run dev -w apps/web
```

The frontend dev server is configured for:

```text
http://localhost:5173/
```

The current frontend uses mock data and does not require the backend for UI-only checks.

Run both apps when backend/API work is needed:

```bash
npm run dev
```

Build everything:

```bash
npm run build
```

Run type checks:

```bash
npm run typecheck
```

Run database migrations:

```bash
npm run db:migrate
```

The migration runner uses `DATABASE_URL` from the API environment and records applied migrations in `schema_migrations`.

## Environment

API environment:

```text
NODE_ENV
HOST
PORT
DATABASE_URL
ADMIN_PASSWORD_HASH
ADMIN_SESSION_SECRET
```

Local defaults are documented in `apps/api/.env.example`.

Production values belong in `/etc/footballvanga.env` on the server and must not be committed.

Generate an admin password hash with:

```bash
npm run admin:hash-password
```

Generate an admin session secret with:

```bash
npm run admin:session-secret
```

## MVP Implementation Order

1. Database schema and migrations.
2. Seed data for World Cup 2026 groups, teams, and group-stage matches.
3. Real room creation, public room list, room entry, and room password hashes.
4. Participant display-name entry, participant code hashes, and participant session ownership.
5. Prediction persistence for group standings and match scores, with backend deadline enforcement.
6. PostgreSQL-backed match results from the hidden admin result-entry screen.
7. Scoring recalculation and room leaderboard.
8. Deployment hardening on the VPS.
9. Scheduled automatic result import.

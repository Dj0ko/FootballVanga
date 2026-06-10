# FootballVanga Session Log

This file is historical context. Do not read it by default. Use it only when you need old implementation history.

## 2026-06-10

### Documentation Context Split

- `docs/project-state.md` was shortened into a compact startup/context file.
- `docs/architecture-map.md` was added for stack, storage, API, frontend/backend file maps, and test map.
- `docs/open-issues.md` was added for active review findings and follow-ups.
- `docs/product-decisions.md` was added for UI/product decisions.
- This `docs/session-log.md` keeps old timeline notes out of startup context.

### Admin Group-Standing Results

- Fixed the P1 review finding where `group_standing_results` had no write path.
- Hidden `/admin/results` now has an official group-standings editor with drag-and-drop team ordering.
- Backend endpoints:
  - `GET /api/admin/group-standings`
  - `PUT /api/admin/groups/:groupId/standings`
- Storage supports PostgreSQL and in-memory fallback.
- Official group-standing writes trigger scoring recalculation.
- API tests cover authorization/validation, persistence, and awarding exact group-position points.

### Mock/Data Retirement

- Frontend local `mockFootball.ts` was removed.
- Current product data now flows from backend endpoints.
- Tournament data lives behind `GET /api/tournament`.
- PostgreSQL reads seeded tournament data; no-database local path uses backend static fallback.
- Hidden `/admin/results` lists all tournament matches from backend tournament data.
- Admin result screen pre-fills scores only from `GET /api/match-history`.
- In-memory match history starts empty.
- `DEFAULT_MATCH_RESULTS` was removed from local no-database path.
- Rooms match-history empty state is intentionally a single line: `Сыгранных матчей пока нет`.
- Global top-5 leaderboard loads from `GET /api/leaderboard/global`.
- Public prediction drill-in is allowed only after shared deadline and only for current top-5 entries.

## 2026-06-09

### UI Work

- Participant rows in room lobby open backend-backed prediction workspace.
- Current participant opens editable workspace.
- Other participants open same workspace read-only.
- Read-only group details remove drag-and-drop, score editing, and save actions.
- `apps/web/src/components/deadline-countdown/DeadlineCountdown.tsx` owns shared one-line deadline timer.
- Shared deadline loads from `GET /api/tournament`.
- Local room deadline labels were removed from room cards, room overview stats, and workspace props.
- Room lobby and workspace topbars use room name as only title text.
- Active participant name belongs in workspace status strip.
- Shared countdown appears in welcome, rooms, room lobby, and workspace headers/topbars.
- Room entry is backend-backed.
- Public room summaries are separate from backend room password checks, participant code checks, and participant session creation.
- `App.tsx` separates current participant session from participant whose prediction is being viewed.
- New participants are created through backend room entry only after room password is accepted.
- Existing participant names require matching 4+ character participant code on backend.
- Prediction workspaces load participant predictions through `GET /api/rooms/:roomId/predictions/:participantId`.
- Editable current-participant workspace saves standings and filled match scores through `PUT /api/rooms/:roomId/predictions/me`.
- Frontend converts between UI team names and backend stable team IDs at API boundary.
- Participant prediction statuses in lobby come from backend summaries as `empty`, `draft`, or `saved`.
- Rooms screen loads match history through `GET /api/match-history`.
- Rooms screen loads all-rooms top-5 leaderboard through `GET /api/leaderboard/global`.
- Global leaderboard participants open public read-only predictions through `GET /api/leaderboard/global/:roomId/predictions/:participantId` after shared deadline.

### Backend Groundwork

- Initial PostgreSQL schema migration was added in `0001_initial_schema.sql`.
- World Cup 2026 group-stage seed migration was added in `0002_seed_world_cup_2026_group_stage.sql`.
- Seed migration covers 12 groups, 48 teams, and 72 group-stage matches.
- Real room creation, public room list, and room password entry were wired to API endpoints.
- Docker/Compose local database scaffolding was intentionally removed.
- Local no-database path follows in-memory fallback pattern.
- Participant display-name entry, participant code hashes, and participant session ownership were wired to API endpoints.
- Prediction persistence for group standings and match scores was wired to API endpoints.
- Prediction saves validate tournament teams/matches, require current participant session, and reject after server-calculated deadline.
- PostgreSQL-backed match results from hidden admin result-entry screen were wired to API endpoints.
- Match result writes require admin session, validate score ranges, reject unknown match IDs, and update public match history.
- API tests were added for password hashing, room endpoints, participant entry/session endpoints, prediction endpoints, match result endpoints, and World Cup seed invariants.
- Scoring recalculation, room leaderboard, and global top-5 leaderboard were completed with PostgreSQL `score_snapshots`, in-memory fallback scoring, admin recalculation, automatic recalculation after prediction/result writes, `GET /api/rooms/:roomId/leaderboard`, and `GET /api/leaderboard/global`.

## Completed Roadmaps

### Backend MVP Path

1. PostgreSQL schema and migrations. Completed.
2. World Cup 2026 seed data and backend tournament endpoint. Completed.
3. Room creation, public room list, room entry, and password hashes. Completed.
4. Participant entry, participant code hashes, and sessions. Completed.
5. Prediction persistence and backend deadline enforcement. Completed.
6. Match results from hidden admin result-entry screen. Completed.
7. Scoring recalculation and room/global leaderboards. Completed.

Next broad areas:

- Deployment hardening.
- Scheduled automatic result import.
- Fixture verification before production.

### Mock/Data Retirement

1. Backend-backed tournament data. Completed.
2. Remove admin completed-results fallback data. Completed.
3. Split frontend UI helpers away from mock data. Completed.
4. API-backed all-rooms top-5 leaderboard. Completed.

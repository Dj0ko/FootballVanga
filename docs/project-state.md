# FootballVanga Project State

Last updated: 2026-06-09

## Current Product Shape

FootballVanga is being built as a SPA prediction game for football group stages.

The agreed Version 1 product scope:

- Password-protected rooms.
- Guest participants with unique display names inside each room.
- A room lobby that shows participant names after room password entry.
- Participants can view other predictions, but can edit only their own prediction.
- Predictions remain editable until a single deadline before the tournament starts.
- The current UI derives that deadline from the first group-stage match kickoff.
- The backend should calculate the same Version 1 deadline from the earliest group-stage match kickoff.
- Version 1 covers only the group stage.
- Rooms can be visible in a common room list, but room contents remain hidden until the room password is accepted.
- The rooms screen after welcome includes the tournament match history/results view for completed games.
- Match results are visible on the rooms screen, but result editing is operator-only.
- Operator-only manual result entry should use the hidden `/admin/results` screen.
- Rules explanation should live in a separate UI window later, not on the welcome screen.

## Current Implementation

The repository currently contains a running application scaffold:

- `apps/web` - React/Vite frontend.
- `apps/api` - Node/Fastify API scaffold.
- `packages/shared` - shared TypeScript types and scoring constants.
- `docs` - business and technical documentation.

The frontend currently has:

- A welcome screen shown first.
- Welcome copy:
  - `FootballVanga`
  - `Закрытая игра прогнозов для футбольных компаний.`
  - `Входи в комнату, оставляй прогноз и следи, как меняется таблица после каждого матча.`
- A shared deadline countdown is shown in the top/header area of the welcome, rooms, room lobby, and prediction workspace screens.
- The current mocked prediction deadline is derived from the earliest World Cup 2026 group-stage match kickoff in `matches`.
- A `Продолжить` button that opens the rooms screen.
- A rooms screen shown after welcome.
- A mocked tournament match history/results view on the rooms screen.
- A room zero state when there are no rooms:
  - `Комнат еще нет`
  - `Откройте первую и зовите свою футбольную компанию.`
- A room creation form with room name and room password fields.
- Room creation currently requires:
  - non-empty room name;
  - room password with at least 4 characters.
- A mocked all-rooms top-5 leaderboard sidebar on the rooms screen.
- Room cards from the API-backed room list open the room entry screen.
- A room entry screen with:
  - backend room password check before entering room contents;
  - participant display name entry;
  - participant code entry with at least 4 characters;
  - backend existing participant name protection by participant code;
  - backend new participant creation when the display name is not taken;
  - backend participant session creation after successful participant entry.
- A mocked room lobby screen with:
  - room overview in the central area;
  - room participant sidebar on the right;
  - room stats for participant count, submitted predictions, and match count;
  - `Мой прогноз` action that opens the group prediction screen.
- Participant rows in the room lobby open that participant's backend-backed prediction screen.
- A backend-backed group prediction screen with all 12 World Cup 2026 groups in a desktop 4-column grid.
- Overview group cards open a focused group detail screen.
- Drag-and-drop team ordering inside the active group detail screen using `@dnd-kit`.
- Match score inputs for the six matches of the active group.
- A `Сохранить группу` action on the group detail screen that persists the current prediction draft.
- Other participants' prediction detail screens are read-only: no drag-and-drop, score editing, or save action.
- Overview cards show whether each group is still a draft or saved.
- Overview cards color the `Счета x/6` counter by completion: red for 0-2, yellow for 3-5, green for 6.
- Team rows show SVG flags imported from the MIT-licensed `flag-icons` package.
- A hidden mocked admin result-entry screen is available at `/admin/results`.
- The admin screen checks backend admin session status, logs in through `POST /api/admin/login`, and writes scores through `PUT /api/admin/matches/:matchId/result`.

The frontend still uses local mock data in `apps/web/src/data/mockFootball.ts` for tournament display and leaderboards. Participant predictions are now loaded from and saved to the backend.

The rooms list, room creation, room password entry, participant entry, participant lists after entry, and hidden `/admin/results` screen call the backend scaffold.

The backend currently has:

- `GET /health`
- `GET /api/meta`
- `GET /api/rooms`
- `POST /api/rooms`
- `POST /api/rooms/:roomId/enter`
- `POST /api/rooms/:roomId/participants/enter`
- `GET /api/rooms/:roomId/participants`
- `GET /api/rooms/:roomId/predictions/:participantId`
- `PUT /api/rooms/:roomId/predictions/me`
- `GET /api/match-history`
- `GET /api/admin/session`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `PUT /api/admin/matches/:matchId/result`
- `POST /api/admin/scoring/recalculate`

Backend result storage is temporary in-memory scaffold state until result endpoints are wired to PostgreSQL.

Room, participant, and prediction storage use PostgreSQL when `DATABASE_URL` is configured and migrations have been applied. Without `DATABASE_URL`, the API uses local in-memory room, participant, and prediction storage so room creation, room password entry, participant entry, participant session checks, and prediction persistence can be checked without a local database; in-memory rooms, participants, sessions, and predictions reset after the API restarts.

Room passwords are hashed with the shared scrypt password-hash helper before storage.

Participant codes are hashed with the shared scrypt password-hash helper before storage. Participant session tokens are returned to the client after successful participant entry and stored server-side only as deterministic SHA-256 hashes.

The backend now also has PostgreSQL migration scaffolding:

- `apps/api/db/migrations/0001_initial_schema.sql` creates the initial MVP schema.
- The initial schema includes rooms, participants, participant sessions, tournament groups, teams, matches, match results, group standing results, participant predictions, score snapshots, and the tournament deadline view.
- `apps/api/db/migrations/0002_seed_world_cup_2026_group_stage.sql` seeds the World Cup 2026 group-stage tournament data.
- The seed migration inserts 12 tournament groups, 48 teams, and 72 group-stage matches with UTC kickoff times.
- `npm run db:migrate` applies pending migrations using `DATABASE_URL`.
- Applied migration versions are stored in `schema_migrations`.
- The migration runner has been syntax-checked, and the workspace typecheck/build passed; applying the migration still requires a configured PostgreSQL database.

The repository now has an automated API test suite:

- `npm test` runs API tests through the root workspace script.
- API tests type-check test files with `apps/api/tsconfig.test.json`.
- The current tests cover shared password hashing, room endpoint behavior, participant entry/session behavior, prediction read/write/deadline behavior through Fastify `inject`, and World Cup 2026 seed migration invariants.

World Cup 2026 group data is now used by the prediction screen and by the backend seed migration. Group-stage fixtures are documented in `docs/world-cup-2026-data.md`.

Current frontend organization:

- `apps/web/src/App.tsx` coordinates the current screen state.
- `apps/web/src/screens/admin-results` contains the hidden operator result-entry screen and its CSS module.
- `apps/web/src/screens/welcome` contains the welcome screen and its CSS module.
- `apps/web/src/screens/rooms` contains the rooms screen and its CSS module.
- `apps/web/src/screens/rooms/components/create-room-form` contains the room creation form and its CSS module.
- `apps/web/src/screens/rooms/components/match-results-history` contains the tournament match history/results view and its CSS module.
- `apps/web/src/screens/rooms/components/rooms-leaderboard` contains the all-rooms leaderboard sidebar and its CSS module.
- `apps/web/src/screens/room-entry` contains backend room password entry and backend participant entry flow.
- `apps/web/src/screens/room-lobby` contains the room lobby screen and its CSS module.
- `apps/web/src/screens/room-lobby/components/room-overview` contains the central room overview and its CSS module.
- `apps/web/src/screens/room-lobby/components/participants-sidebar` contains the room participants sidebar and its CSS module.
- `apps/web/src/api/predictions.ts` contains prediction read/write API calls.
- `apps/web/src/screens/workspace` contains the backend-backed prediction workspace and its CSS module.
- `apps/web/src/screens/workspace/components/group-prediction-board` contains the 12-group prediction board and its CSS module.
- `apps/web/src/screens/workspace/components/group-prediction-card` contains the read-only overview group card and its CSS module.
- `apps/web/src/screens/workspace/components/group-prediction-detail` contains the active group editor with sortable standings, match score inputs, and its CSS module.
- `apps/web/src/data/teamFlags.ts` imports only the needed tournament flag SVG assets from `flag-icons`.
- `apps/web/src/styles.css` contains only global base styles.

## Completed UI Decisions

### Welcome Screen

The welcome screen is considered ready for now.

Current welcome screen decisions:

- The welcome screen uses an abstract football field drawn in CSS, not an image asset.
- The field background is dark green with subtle grass stripes.
- Text uses a high-contrast light palette over the green background.
- The `Продолжить` button uses a warm yellow accent.
- The field markings include:
  - outer field border;
  - center vertical line;
  - center circle and center dot;
  - left and right penalty boxes.
- Horizontal field lines were intentionally removed because they do not match football field markings.
- The left-side dark gradient is intentional and should remain because it improves text contrast.
- Rules/scoring explanations should not appear on the welcome screen; they will be added later in a separate rules window/modal.

### Rooms Screen

The first screen after welcome should be the rooms screen.

Current rooms screen decisions:

- If there are no rooms, show an empty state instead of the workspace.
- Empty state copy:
  - `Комнат еще нет`
  - `Откройте первую и зовите свою футбольную компанию.`
- The room empty state should stay text-and-action focused; no decorative plus icon above the copy.
- The rooms screen should use a two-column desktop layout: a narrower rooms panel on the left and a leaderboard sidebar on the right.
- On narrower screens, the leaderboard sidebar should stack below the rooms panel.
- The `Создать комнату` action opens an inline room creation form.
- Room creation form fields:
  - `Название комнаты`
  - `Пароль комнаты`
- Room creation form layout should keep fields in a vertical stack.
- Room creation form should be a compact centered block, not stretched across the whole rooms panel.
- Room creation form actions should sit at the bottom in this order:
  - `Создать комнату`
  - `Отмена`
- Password validation should stay lightweight for Version 1: minimum 4 characters, no special-character/case/number rules.
- The password field can be shown or hidden to reduce entry mistakes.
- The form creates the new room through the backend and then adds the returned public room summary to the UI.
- Existing rooms are shown as compact room cards with participant count, locked-room status, and enter action.
- Room card enter actions should use the green primary style, not a red/destructive style.
- The rooms screen shows completed group-stage match results/history below the room list.
- The right sidebar should be titled `ТОП-5 лидеров рейтинга` and show a mocked top-5 participant leaderboard across all rooms.
- The all-rooms leaderboard ranks by total points, then exact score count as a tiebreaker.

### Admin Result Entry

Current admin result-entry decisions:

- Manual result entry lives at the hidden route `/admin/results`.
- The admin route is not linked from normal participant screens.
- Admin login uses an operator password checked by the backend.
- The password hash belongs in `ADMIN_PASSWORD_HASH`, not in frontend code.
- Admin sessions use an HTTP-only cookie signed with `ADMIN_SESSION_SECRET`.
- Normal room passwords and participant codes must not grant access to result writes.
- The current backend result writes are in-memory scaffold behavior until the database exists.

### Room Lobby Screen

After clicking `Войти` on a room card, the user should land on the room entry screen before the room lobby.

### Room Entry Screen

Current room entry decisions:

- The room entry screen first asks for the room password.
- Room contents stay hidden until the room password is accepted.
- After room password acceptance, the user enters a participant display name and participant code.
- Participant display names are unique inside a room.
- If the display name is already taken, the backend requires the matching participant code.
- If the display name is free, the backend creates a new participant for that room.
- Participant codes use the same lightweight Version 1 rule as room passwords: minimum 4 characters.
- `RoomSummary` remains public room data and does not include room password hashes.
- Real room passwords and participant codes are checked by the backend.
- Successful participant entry returns a participant session token. The token is currently kept in React state and will be used for prediction ownership checks in the prediction persistence step.

### Room Lobby Screen

After room password and participant entry, the user lands on the room lobby before the prediction workspace.

Current room lobby decisions:

- The room lobby has a topbar with:
  - back action to the rooms screen;
  - room name as the only title text;
  - locked-room status.
- The central area shows common room content rather than participant predictions:
  - `Обзор комнаты`;
  - room status `Прогнозы открыты`;
  - participant count;
  - submitted prediction count;
  - match count.
- The room lobby topbar shows the shared deadline countdown.
- The right sidebar is titled `Участники` and shows the participant list.
- The room lobby central area should not include a separate room top list while the participant sidebar is visible.
- Participant rows open that participant's prediction view.
- The current participant session opens the editable `Мой прогноз` workspace.
- Other participant rows open the same prediction workspace in read-only mode.
- The `Мой прогноз` action opens the backend-backed group prediction screen.
- Result editing must not be available to normal room participants; it belongs to an operator/admin flow.

### My Prediction Screen

Current prediction screen decisions:

- The first `Мой прогноз` screen focuses on predicted final group standings.
- It shows all 12 World Cup 2026 groups.
- On desktop, groups use a 4-column grid, which gives the intended 3 rows by 4 groups.
- The 12-group overview is read-only for ordering and acts as navigation into a group detail screen.
- Teams can be reordered with drag-and-drop only inside the active group detail screen.
- Match scores are entered inside the active group detail screen.
- The group detail screen has back-to-overview, previous-group, and next-group navigation.
- The group detail screen has a `Сохранить группу` action that saves the current prediction draft through the backend.
- `Сохранить группу` is available even for partially filled groups, so a partial draft can be persisted.
- Saving a group marks it as saved in local React state for the current workspace session; editing that group's team order or match scores returns it to draft state until the next save.
- Groups with fewer than six filled match scores always display as `Черновик`, even if the current partial group draft was saved.
- A group displays `Сохранено` only after it has been saved and all six match scores are filled.
- The overview screen shows saved/draft status per group and a saved-groups counter.
- The overview `Счета x/6` label is red for 0-2 filled scores, yellow for 3-5, and green for 6/6.
- Save actions use the warm yellow accent, not the red/destructive color.
- Team rows show a flag next to each team name.
- Team ordering and match score inputs are edited in local React state and persisted through the backend on save.
- The workspace can show either the current participant's editable prediction or another participant's read-only prediction.
- The backend enforces prediction ownership through the participant session token and rejects prediction saves at or after the tournament deadline.
- The prediction workspace topbar title is the room name, with the shared deadline countdown on the right.
- The prediction workspace status strip always shows the active participant name for both editable and read-only views.
- Mock group-stage matches now use the documented World Cup 2026 fixture order, dates, venues, and kickoff times.
- Kickoff times are stored as UTC ISO timestamps and displayed with `Intl.DateTimeFormat` in the browser's current time zone, without repeating a GMT offset in every match row.
- Before production seed/migrations, fixture data should still be re-verified against FIFA's official schedule.

## Local Development Notes

Do not start the local app unless the user explicitly asks.

Prediction reads/writes, room list, room creation, room password entry, participant entry, and participant lists require the API. Without `DATABASE_URL`, the API uses in-memory room, participant, and prediction storage; set `DATABASE_URL` and run migrations only when PostgreSQL-backed storage is needed.

Docker/Compose is not part of the local development path. The local backend should be usable without Docker and without a local PostgreSQL instance by leaving `DATABASE_URL` empty.

Start only the frontend when explicitly requested:

```bash
npm run dev -w apps/web
```

Open:

```text
http://localhost:5173/
```

The root command starts both frontend and backend:

```bash
npm run dev
```

Use the root command only when backend/API work needs both processes.

For split local startup, use:

```bash
npm run dev:api
npm run dev:web
```

## Localhost Decision

The user prefers `localhost` over `127.0.0.1` for local development.

Current local settings:

- Vite frontend host: `localhost`.
- Vite frontend port: `5173`.
- API default host: `localhost`.
- API default port: `4100`.
- Vite proxy target: `http://localhost:4100`.

Production Nginx may still proxy to `127.0.0.1:4100`, which is appropriate on the server.

## Notes For Next Session

Recent UI work completed on 2026-06-09:

- Participant rows in the room lobby now open that participant's backend-backed prediction workspace.
- The current participant opens an editable workspace; other participants open the same workspace in read-only mode.
- Read-only group details intentionally remove drag-and-drop behavior, score editing, and save actions.
- `apps/web/src/components/deadline-countdown/DeadlineCountdown.tsx` owns the shared one-line deadline timer.
- The mocked deadline is derived from the earliest `matches[].startsAtIso` value in `apps/web/src/data/mockFootball.ts`.
- Local room deadline labels were removed from room cards, room overview stats, and workspace props.
- Room lobby and workspace topbars use the room name as the only title text.
- The active participant name belongs in the workspace status strip, not in the topbar title.
- The shared countdown appears in the welcome, rooms, room lobby, and workspace header/topbar areas.
- Room entry is backend-backed: public room summaries are separate from backend room password checks, participant code checks, and participant session creation.
- `App.tsx` now separates the current participant session from the participant whose prediction is being viewed.
- New participants are created through the backend room entry flow only after the room password is accepted.
- Existing participant names require the matching 4+ character participant code on the backend; entering someone else's name without that code must not grant edit access.
- Prediction workspaces now load participant predictions through `GET /api/rooms/:roomId/predictions/:participantId`.
- The editable current-participant workspace saves standings and filled match scores through `PUT /api/rooms/:roomId/predictions/me`.
- The frontend converts between UI team names and backend stable team IDs at the API boundary.
- Participant prediction statuses in the lobby now come from backend summaries as `empty`, `draft`, or `saved`.

Recent backend groundwork completed on 2026-06-09:

- Initial PostgreSQL schema migration was added in `0001_initial_schema.sql`.
- World Cup 2026 group-stage seed migration was added in `0002_seed_world_cup_2026_group_stage.sql`.
- The seed migration covers 12 groups, 48 teams, and 72 group-stage matches.
- Real room creation, public room list, and room password entry were wired to API endpoints with in-memory local storage and PostgreSQL storage when `DATABASE_URL` is set.
- Docker/Compose local database scaffolding was intentionally removed; the local no-database path follows the same in-memory fallback pattern as `DjokoNards`.
- Participant display-name entry, participant code hashes, and participant session ownership were wired to API endpoints with in-memory local storage and PostgreSQL storage when `DATABASE_URL` is set.
- Prediction persistence for group standings and match scores was wired to API endpoints with in-memory local storage and PostgreSQL storage when `DATABASE_URL` is set.
- Prediction saves are validated against tournament teams/matches, require the current participant session, and are rejected after the server-calculated tournament deadline.
- API tests were added for password hashing, room endpoints, participant entry/session endpoints, prediction endpoints, and World Cup seed invariants.
- PostgreSQL-backed match results from the hidden admin result-entry screen remain the next backend roadmap step.

## Verification Policy

After code changes, Codex should assess whether the current automated tests cover the changed behavior. If the change needs additional tests, or if a meaningful coverage gap remains after the available checks, Codex should tell the user explicitly and name the missing test coverage.

Allowed without explicit app launch permission:

- `npm test`
- `npm run typecheck`
- `npm run build`
- `git status`
- `git diff`

Requires explicit user permission:

- Starting a dev server.
- Opening or reloading the local app in a browser.
- Browser-based UI testing.

## Backend Implementation Roadmap

The UI is considered complete enough for the current mock stage. The next work should move the product from local mock state to backend-backed behavior in this order:

1. PostgreSQL schema and migrations. Completed as initial migration scaffold; future schema changes should add new migration files.
2. Seed data for World Cup 2026 groups, teams, and group-stage matches. Completed as `0002_seed_world_cup_2026_group_stage.sql`.
3. Real room creation, public room list, room entry, and room password hashes. Completed as API endpoints with frontend wiring, in-memory local storage, and PostgreSQL storage when `DATABASE_URL` is set.
4. Participant display-name entry, participant code hashes, and participant session ownership. Completed as API endpoints with frontend wiring, in-memory local storage, and PostgreSQL storage when `DATABASE_URL` is set.
5. Prediction persistence for group standings and match scores, with backend deadline enforcement. Completed as API endpoints with frontend wiring, in-memory local storage, and PostgreSQL storage when `DATABASE_URL` is set.
6. PostgreSQL-backed match results from the hidden admin result-entry screen, replacing current in-memory result storage.
7. Scoring recalculation and room leaderboard.

After these seven steps, continue with deployment hardening and scheduled automatic result sync against an external source.

Open product/UI work that can wait until the backend path is underway:

- Verify World Cup 2026 group-stage fixture data against FIFA before production seed/migrations.
- Add a rules explanation modal/window.

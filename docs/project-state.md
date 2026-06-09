# FootballVanga Project State

Last updated: 2026-06-09

## Current Product Shape

FootballVanga is being built as a SPA prediction game for football group stages.

The agreed Version 1 product scope:

- Password-protected rooms.
- Guest participants with unique display names inside each room.
- A room lobby that shows participant names after room password entry.
- Participants can view other predictions, but can edit only their own prediction.
- Predictions remain editable until a single room deadline before the tournament starts.
- Version 1 covers only the group stage.
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
  - `Входи в комнату, оставляй прогноз до старта турнира и следи, как меняется таблица после каждого матча.`
- A `Продолжить` button that opens the mocked room/prediction workspace.
- A mocked room entry panel.
- A mocked lobby with participants.
- Mocked group standing and match score controls.
- A mocked leaderboard.

The frontend still uses local mock data in `apps/web/src/App.tsx`. It does not call the backend yet.

## Local Development Notes

Do not start the local app unless the user explicitly asks.

For current UI-only work, backend is not required. Start only the frontend when explicitly requested:

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

## Localhost Decision

The user prefers `localhost` over `127.0.0.1` for local development.

Current local settings:

- Vite frontend host: `localhost`.
- Vite frontend port: `5173`.
- API default host: `localhost`.
- API default port: `4100`.
- Vite proxy target: `http://localhost:4100`.

Production Nginx may still proxy to `127.0.0.1:4100`, which is appropriate on the server.

## Verification Policy

Allowed without explicit app launch permission:

- `npm run typecheck`
- `npm run build`
- `git status`
- `git diff`

Requires explicit user permission:

- Starting a dev server.
- Opening or reloading the local app in a browser.
- Browser-based UI testing.

## Next Likely Work

Likely next UI/product work:

- Replace the mocked room workspace with a real step-by-step flow.
- Add a rules explanation modal/window.
- Design room entry and lobby states.
- Add read-only participant prediction views.

Likely next backend work:

- Database schema and migrations.
- Room creation and entry endpoints.
- Participant session ownership.
- Prediction persistence.

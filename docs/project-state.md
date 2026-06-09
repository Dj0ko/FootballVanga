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
- A `Продолжить` button that opens the mocked rooms screen.
- A mocked rooms screen shown after welcome.
- A room zero state when there are no rooms:
  - `Комнат еще нет`
  - `Откройте первую и зовите свою футбольную компанию.`
- A mocked room creation form with room name and room password fields.
- Room creation currently requires:
  - non-empty room name;
  - room password with at least 8 characters.
- A mocked room card that opens the room/prediction workspace.
- A mocked room entry panel.
- A mocked lobby with participants.
- Mocked group standing and match score controls.
- A mocked leaderboard.

The frontend still uses local mock data in `apps/web/src/data/mockFootball.ts`. It does not call the backend yet.

Current frontend organization:

- `apps/web/src/App.tsx` coordinates the current screen state.
- `apps/web/src/screens/welcome` contains the welcome screen and its CSS module.
- `apps/web/src/screens/rooms` contains the rooms list / zero state screen and its CSS module.
- `apps/web/src/screens/workspace` contains the mocked prediction workspace and its CSS module.
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
- The `Создать комнату` action opens an inline room creation form.
- Room creation form fields:
  - `Название комнаты`
  - `Пароль комнаты`
- Room creation form layout should keep fields in a vertical stack.
- Room creation form should be a compact centered block, not stretched across the whole rooms panel.
- Room creation form actions should sit at the bottom in this order:
  - `Создать комнату`
  - `Отмена`
- Password validation should stay lightweight for Version 1: minimum 8 characters, no special-character/case/number rules.
- The password field can be shown or hidden to reduce entry mistakes.
- The mocked form adds the new room to the local room list for now.
- Existing rooms are shown as compact room cards with participant count, locked-room status, deadline label, and enter action.
- Room card enter actions should use the green primary style, not a red/destructive style.

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
- Connect the mocked room creation form to real backend room creation.
- Add a rules explanation modal/window.
- Design room entry and lobby states.
- Add read-only participant prediction views.

Likely next backend work:

- Database schema and migrations.
- Room creation and entry endpoints.
- Participant session ownership.
- Prediction persistence.

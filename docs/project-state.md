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
  - `Входи в комнату, оставляй прогноз и следи, как меняется таблица после каждого матча.`
- A shared deadline countdown is shown in the top/header area of the welcome, rooms, room lobby, and prediction workspace screens.
- The current mocked prediction deadline is derived from the earliest World Cup 2026 group-stage match kickoff in `matches`.
- A `Продолжить` button that opens the mocked rooms screen.
- A mocked rooms screen shown after welcome.
- A room zero state when there are no rooms:
  - `Комнат еще нет`
  - `Откройте первую и зовите свою футбольную компанию.`
- A mocked room creation form with room name and room password fields.
- Room creation currently requires:
  - non-empty room name;
  - room password with at least 4 characters.
- A mocked all-rooms top-5 leaderboard sidebar on the rooms screen.
- A mocked room card that opens the room entry screen.
- A mocked room entry screen with:
  - room password check before entering room contents;
  - participant display name entry;
  - participant code entry with at least 4 characters;
  - existing participant name protection by participant code;
  - new participant creation when the display name is not taken.
- A mocked room lobby screen with:
  - room overview in the central area;
  - room participant sidebar on the right;
  - room stats for participant count, submitted predictions, and match count;
  - `Мой прогноз` action that opens the mocked group prediction screen.
- Participant rows in the room lobby open that participant's mocked prediction screen.
- A mocked group prediction screen with all 12 World Cup 2026 groups in a desktop 4-column grid.
- Overview group cards open a focused group detail screen.
- Drag-and-drop team ordering inside the active group detail screen using `@dnd-kit`.
- Match score inputs for the six matches of the active group.
- A mocked `Сохранить группу` action on the group detail screen.
- Other participants' prediction detail screens are read-only: no drag-and-drop, score editing, or save action.
- Overview cards show whether each group is still a draft or saved.
- Overview cards color the `Счета x/6` counter by completion: red for 0-2, yellow for 3-5, green for 6.
- Team rows show SVG flags imported from the MIT-licensed `flag-icons` package.

The frontend still uses local mock data in `apps/web/src/data/mockFootball.ts`. It does not call the backend yet.

World Cup 2026 group data is now used by the mocked prediction screen. Group-stage fixtures for future seed data are documented in `docs/world-cup-2026-data.md`.

Current frontend organization:

- `apps/web/src/App.tsx` coordinates the current screen state.
- `apps/web/src/screens/welcome` contains the welcome screen and its CSS module.
- `apps/web/src/screens/rooms` contains the rooms screen and its CSS module.
- `apps/web/src/screens/rooms/components/create-room-form` contains the room creation form and its CSS module.
- `apps/web/src/screens/rooms/components/rooms-leaderboard` contains the all-rooms leaderboard sidebar and its CSS module.
- `apps/web/src/screens/room-entry` contains the mocked room password and participant entry flow.
- `apps/web/src/screens/room-lobby` contains the room lobby screen and its CSS module.
- `apps/web/src/screens/room-lobby/components/room-overview` contains the central room overview and its CSS module.
- `apps/web/src/screens/room-lobby/components/participants-sidebar` contains the room participants sidebar and its CSS module.
- `apps/web/src/screens/workspace` contains the mocked prediction workspace and its CSS module.
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
- The mocked form adds the new room to the local room list for now.
- Existing rooms are shown as compact room cards with participant count, locked-room status, and enter action.
- Room card enter actions should use the green primary style, not a red/destructive style.
- The right sidebar should be titled `ТОП-5 лидеров рейтинга` and show a mocked top-5 participant leaderboard across all rooms.
- The all-rooms leaderboard ranks by total points, then exact score count as a tiebreaker.

### Room Lobby Screen

After clicking `Войти` on a room card, the user should land on the room entry screen before the room lobby.

### Room Entry Screen

Current room entry decisions:

- The room entry screen first asks for the room password.
- Room contents stay hidden until the room password is accepted.
- After room password acceptance, the user enters a participant display name and participant code.
- Participant display names are unique inside a room.
- If the display name is already taken, the participant code must match that existing participant.
- If the display name is free, the UI creates a new mocked participant for that room.
- Participant codes use the same lightweight Version 1 rule as room passwords: minimum 4 characters.
- Mock room passwords and participant codes are kept outside `RoomSummary` so the frontend shape is closer to future backend API contracts.
- `RoomSummary` should remain public room data; real room passwords and participant codes should be checked by backend endpoints later.

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
- The `Мой прогноз` action opens the mocked group prediction screen for now.

### My Prediction Screen

Current prediction screen decisions:

- The first `Мой прогноз` screen focuses on predicted final group standings.
- It shows all 12 World Cup 2026 groups.
- On desktop, groups use a 4-column grid, which gives the intended 3 rows by 4 groups.
- The 12-group overview is read-only for ordering and acts as navigation into a group detail screen.
- Teams can be reordered with drag-and-drop only inside the active group detail screen.
- Match scores are entered inside the active group detail screen.
- The group detail screen has back-to-overview, previous-group, and next-group navigation.
- The group detail screen has a mocked `Сохранить группу` action.
- `Сохранить группу` is available even for partially filled groups, so a partial draft can be saved locally.
- Saving a group marks it as saved in local React state; editing that group's team order or match scores returns it to draft state.
- Groups with fewer than six filled match scores always display as `Черновик`, even if the current partial group draft was saved.
- A group displays `Сохранено` only after it has been saved and all six match scores are filled.
- The overview screen shows saved/draft status per group and a saved-groups counter.
- The overview `Счета x/6` label is red for 0-2 filled scores, yellow for 3-5, and green for 6/6.
- Save actions use the warm yellow accent, not the red/destructive color.
- Team rows show a flag next to each team name.
- Team ordering and match score inputs are stored in local React state for now.
- The workspace can show either the current participant's editable prediction or another participant's read-only prediction.
- The prediction workspace topbar title is the room name, with the shared deadline countdown on the right.
- The prediction workspace status strip always shows the active participant name for both editable and read-only views.
- Mock group-stage matches now use the documented World Cup 2026 fixture order, dates, venues, and kickoff times.
- Kickoff times are stored as UTC ISO timestamps and displayed with `Intl.DateTimeFormat` in the browser's current time zone, without repeating a GMT offset in every match row.
- Before production seed/migrations, fixture data should still be re-verified against FIFA's official schedule.

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

## Notes For Next Session

Recent UI work completed on 2026-06-09:

- Participant rows in the room lobby now open that participant's mocked prediction workspace.
- The current participant opens an editable workspace; other participants open the same workspace in read-only mode.
- Read-only group details intentionally remove drag-and-drop behavior, score editing, and save actions.
- `apps/web/src/components/deadline-countdown/DeadlineCountdown.tsx` owns the shared one-line deadline timer.
- The mocked deadline is derived from the earliest `matches[].startsAtIso` value in `apps/web/src/data/mockFootball.ts`.
- Local room deadline labels were removed from room cards, room overview stats, and workspace props.
- Room lobby and workspace topbars use the room name as the only title text.
- The active participant name belongs in the workspace status strip, not in the topbar title.
- The shared countdown appears in the welcome, rooms, room lobby, and workspace header/topbar areas.
- Room entry is mocked in a backend-shaped way: public room summaries are separate from room password checks and participant code checks.
- `App.tsx` now separates the current participant session from the participant whose prediction is being viewed.
- New participants are created through the mocked room entry flow only after the room password is accepted.
- Existing participant names require the matching 4+ character participant code; entering someone else's name without that code must not grant edit access.

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

- Connect the mocked group save action to prediction persistence.
- Verify World Cup 2026 group-stage fixture data against FIFA before production seed/migrations.
- Connect the mocked room creation form to real backend room creation.
- Add a rules explanation modal/window.

Likely next backend work:

- Database schema and migrations.
- Room creation and entry endpoints.
- Participant session ownership.
- Prediction persistence.

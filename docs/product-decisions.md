# FootballVanga Product Decisions

Use this for UI/product work after reading `docs/project-state.md`.

## Welcome Screen

- The welcome screen is considered ready for now.
- It uses an abstract football field drawn in CSS, not an image asset.
- Field background is dark green with subtle grass stripes.
- Text uses a high-contrast light palette over the green background.
- `Продолжить` uses a warm yellow accent.
- Field markings include outer border, center vertical line, center circle/dot, and left/right penalty boxes.
- Horizontal field lines were intentionally removed because they do not match football field markings.
- The left-side dark gradient is intentional for text contrast.
- Rules/scoring explanations should not appear on the welcome screen.

## Scoring Rules Dialog

- The entry point is a compact `Правила` button in product topbars.
- It appears on rooms, room lobby, and prediction workspace screens, including public read-only prediction views.
- Dialog explains:
  - 1 point for each exact final group position;
  - 1 point for correct match outcome;
  - 2 additional points for exact score;
  - exact score gives 3 total match points;
  - leaderboard ties are broken by exact score count.
- It also reminds users that predictions are editable until the shared deadline and read-only after it.
- Scoring numbers come from shared constants.

## Rooms Screen

- First screen after welcome.
- If there are no rooms, show empty state:
  - `Комнат еще нет`
  - `Откройте первую и зовите свою футбольную компанию.`
- Empty state is text-and-action focused; no decorative plus icon above copy.
- Desktop layout is two columns: rooms panel left, leaderboard sidebar right.
- Narrow screens stack leaderboard below rooms.
- `Создать комнату` opens inline room creation form.
- Room form fields:
  - `Название комнаты`
  - `Пароль комнаты`
- Form fields are vertically stacked.
- Form is compact and centered, not stretched across the whole panel.
- Actions order:
  - `Создать комнату`
  - `Отмена`
- Room password rule for V1: minimum 4 characters only.
- Password field may be shown/hidden to reduce mistakes.
- Existing rooms are compact cards with participant count, locked status, and enter action.
- Room card enter actions use green primary style.
- Completed match results/history appears below room list.
- Right sidebar title: `ТОП-5 лидеров рейтинга`.
- Global top-5 is API-backed and includes only participants with `totalScore > 0`.
- Clicking a global leader opens a public read-only prediction after the shared deadline only.

## Room Entry

- Room card opens room entry before lobby.
- Screen first asks for room password.
- Room contents stay hidden until password is accepted.
- After password acceptance, user enters display name and participant code.
- Display names are unique within a room.
- Existing display name requires matching participant code.
- Free display name creates a new participant.
- Participant code has the same lightweight V1 rule as room passwords: minimum 4 characters.
- Successful participant entry returns a participant session token currently held in React state.

## Room Lobby

- User lands here after room password and participant entry.
- Topbar has:
  - back action to rooms;
  - room name as only title text;
  - locked-room status;
  - shared deadline countdown.
- Central area shows common room overview, not participant predictions:
  - `Обзор комнаты`
  - status `Прогнозы открыты`
  - participant count
  - submitted prediction count
  - match count
- Right sidebar title: `Участники`.
- Participant rows open that participant's prediction.
- Current participant opens editable `Мой прогноз`.
- Other participants open same workspace read-only.
- Result editing is never available to room participants.

## Prediction Workspace

- First `Мой прогноз` screen focuses on predicted final group standings.
- Shows all 12 World Cup 2026 groups.
- Desktop overview uses 4 columns.
- Overview group cards are read-only for ordering and navigate into group detail.
- Teams can be reordered only in active group detail.
- Match score inputs live in active group detail.
- Detail screen has back-to-overview, previous-group, and next-group navigation.
- `Сохранить группу` saves current prediction draft through backend.
- Partial group drafts can be saved.
- Locally, editing a saved group returns it to draft until next save.
- Groups with fewer than six filled match scores show `Черновик`, even if a partial draft was saved.
- Group shows `Сохранено` only after saved and all six match scores are filled.
- Overview shows saved/draft status per group and saved-groups counter.
- `Счета x/6` colors:
  - red for 0-2;
  - yellow for 3-5;
  - green for 6.
- Save actions use warm yellow accent.
- Team rows show flags.
- Backend enforces prediction ownership and deadline lock.
- Workspace topbar title is room name.
- Active participant name belongs in status strip, not topbar title.
- Kickoff times display with `Intl.DateTimeFormat` in browser timezone.

## Admin Results

- Manual result entry lives at hidden `/admin/results`.
- Admin route is not linked from participant screens.
- Admin login uses operator password checked by backend.
- Password hash belongs in `ADMIN_PASSWORD_HASH`, not frontend code.
- Admin sessions use HTTP-only cookie signed with `ADMIN_SESSION_SECRET`.
- Normal room passwords and participant codes never grant result writes.
- Match scores are saved by operator.
- Official final group standings are saved by operator by reordering teams in each group.
- Saving match scores or official group standings triggers scoring recalculation when scoring storage is configured.

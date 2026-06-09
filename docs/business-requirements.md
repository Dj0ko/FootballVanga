# FootballVanga Business Requirements

## Product Summary

FootballVanga is a SPA prediction game for football tournament group stages.

Users join password-protected rooms, create a guest display name, submit predictions for group standings and match scores, and compete on a shared leaderboard. Predictions remain editable until a configured tournament deadline. After the deadline, predictions are locked and scoring updates as real match results and final group standings become available.

## Goals

- Let groups of friends or communities run private football prediction rooms.
- Keep entry lightweight: no full account system in the first version.
- Make predictions and standings visible to room participants.
- Calculate scores automatically once official results are available.
- Use the existing server stack: SPA frontend, Node.js backend, PostgreSQL, Nginx, and systemd.

## Non-Goals For Version 1

- Full registered user accounts.
- Email, social login, or password recovery.
- Playoff stage predictions.
- Public global leaderboard across all rooms.
- Payments, moderation dashboard, or anti-abuse automation beyond basic creation limits.

## Users And Roles

### Guest Participant

A guest participant can:

- Open the app.
- Select or open a room.
- Enter the room password.
- Choose a unique display name for that room.
- Create or edit predictions until the room deadline.
- Save predictions.
- View all participant predictions in rooms they can access.
- Edit only their own predictions.
- View room leaderboard and intermediate scoring.

### Room Creator

A room creator can:

- Create a prediction room.
- Set the room name.
- Set the room password / join code.
- Set the prediction deadline.
- Share room access details with participants.

Room creation should be available to users, but should include basic spam prevention.

### Admin / Operator

An operator can:

- Manage rooms if needed.
- Update or verify real match results manually.
- Trigger recalculation if automatic result import fails.
- Disable abusive rooms if this becomes necessary.

## Room Model

Each room has:

- Name.
- Password / join code.
- Prediction deadline.
- Tournament configuration.
- List of participants.
- Participant predictions.
- Leaderboard.

Rooms are isolated by access control, not by global accounts. A participant who knows another room password can join that room and view its predictions and leaderboard.

Participant predictions are isolated by ownership. A participant can view other participants' predictions in the same room, but cannot edit them.

## Room Access And Discovery

Version 1 should not require a public room directory.

Users can enter a room from the start page by using the room access details they received from the room creator. A direct room link may also be supported, but it should only open the room entry screen. Room contents, participant predictions, and leaderboard data remain hidden until the correct room password / join code is entered.

In the guest model, a person is considered a room participant after successfully entering the room password, creating a unique display name, and setting a participant code. A person who only has a direct room link, but does not have the room password, should not be able to view room contents.

The room creator is responsible for sharing the room password / join code with intended participants.

After entering the correct room password / join code, the user should see a room lobby with the current participant list. This helps returning users remember which display name they used.

The participant list does not grant edit rights by itself. It only helps with navigation and recognition.

## Participant Identity

Version 1 uses guest identity.

When joining a room, a participant creates a display name and a short participant code. This name is shown to other room participants in prediction views and leaderboard tables.

Display names must be unique within a room. If a display name is already taken, the app should treat that as a returning participant attempt and require the matching participant code.

Participant codes are lightweight Version 1 credentials, not full site accounts. They protect edit access for a participant inside one room.

Participants are expected to start from the app home page, enter the room password / join code, and continue into the room.

The app must identify which participant owns the current browser session. Before the deadline, the participant can edit only the prediction connected to that participant identity.

If a participant returns from the same browser session, the app may show a clear "continue as <display name>" action for the participant identity stored in that browser.

If a participant returns from a different browser, the app should ask for the room password, display name, and participant code.

If a participant opens another participant's prediction, it must be shown in read-only mode.

If a user enters the room and creates a new display name, that is treated as a new participant. It does not give access to edit any existing participant's predictions.

Entering another participant's display name without that participant's code must not grant edit access.

## Prediction Flow

1. User opens the app.
2. User chooses or opens a room.
3. User enters the room password / join code.
4. User enters a display name and participant code.
5. Existing display names require the matching participant code.
6. New display names create a new room participant with that code.
7. User sees the room lobby with existing participant names.
8. Returning user continues as their existing participant when the browser session can prove ownership.
9. User fills group standings predictions.
10. User fills match score predictions.
11. User saves predictions.
12. Until the room deadline, user can return and edit their own predictions.
13. After the deadline, predictions become locked.
14. User can view the room leaderboard and other participants' predictions.

## Deadline Rules

- Each room has a prediction deadline.
- The deadline is before the tournament starts.
- Predictions are editable until the deadline.
- Predictions become read-only after the deadline.
- Version 1 uses one global deadline per room, not per-match deadlines.

## Tournament Scope

Version 1 covers only the group stage.

The app must support:

- Groups.
- Teams within each group.
- Group stage matches.
- Predicted final group positions.
- Predicted match scores.
- Actual group positions.
- Actual match scores.

## Scoring Rules

### Group Standings

- A participant receives 1 point for each team whose exact final group position is predicted correctly.
- Only exact position matters.
- There is no separate reward for simply predicting qualification or top-two placement.

Example:

- Predicted: Team A finishes 1st.
- Actual: Team A finishes 1st.
- Award: 1 point.

### Match Result

- A participant receives 1 point for predicting the correct match result type.
- Result types are win, loss, and draw from the perspective of the predicted score.

Example:

- Predicted: Team A 2-1 Team B.
- Actual: Team A 1-0 Team B.
- Award: 1 point for correct win/loss result.

### Exact Score

- A participant receives 2 points for predicting the exact final score.
- Exact score points are added on top of match result points.

Example:

- Predicted: Team A 2-1 Team B.
- Actual: Team A 2-1 Team B.
- Award: 3 points total: 1 for result plus 2 for exact score.

### Leaderboard Ties

If participants have the same total score, the participant with more exact score predictions should rank higher.

## Results And Automation

Ideal behavior:

- The system periodically fetches real match results from an external source.
- Imported results update match records.
- Scoring recalculates automatically after result changes.
- Leaderboards update without manual intervention.

Fallback behavior:

- An operator can enter or correct results manually.
- An operator can trigger recalculation manually.

The exact data source for official match results is not chosen yet and must be evaluated before implementation.

## Visibility Rules

Within a room, participants can see:

- The leaderboard.
- All participant display names.
- All submitted predictions.
- How other participants predicted match scores and group standings.

Predictions are not hidden before the deadline in Version 1.

Visible predictions are not editable by other participants. Only the prediction owner can edit their own prediction before the deadline.

## Room Creation And Spam Prevention

Users should be able to create rooms, but the product should avoid becoming an open spam target.

Each room has its own password / join code. The room creator knows this code and is responsible for sharing it with invited participants.

Potential controls:

- Require a simple creation code controlled by the operator.
- Rate-limit room creation by IP address.
- Add a lightweight admin approval step.
- Keep rooms unlisted unless accessed by direct link or exact room name.
- Add a maximum number of rooms per IP per day.

The first implementation should choose the simplest effective control.

## UI Direction

The app should feel more like a game than a plain admin form.

Expected UI areas:

- Room entry screen.
- Room creation screen.
- Participant name entry.
- Group standings prediction interface.
- Match score prediction interface.
- Save / edit state.
- Locked prediction state.
- Room leaderboard.
- Participant prediction comparison view.
- Admin or operator result management view, if automatic import is not ready for Version 1.

Detailed visual design will be decided during application development.

## Technical Direction

Use the existing server environment:

- SPA frontend.
- Node.js backend.
- PostgreSQL database.
- Nginx reverse proxy.
- systemd service for backend process management.

Avoid introducing additional infrastructure unless there is a clear product need.

## Open Questions

- Should room creation itself require an operator-controlled creation code, or is rate limiting enough for Version 1?
- What external result source should be used for automatic score importing?
- Should automatic result importing be included in Version 1, or should Version 1 ship with manual result entry and add importing later?
- Should a participant be able to delete their prediction before the deadline?
- Should leaderboard ties after exact score count stay tied, or use a second tie-breaker?

# FootballVanga Open Issues

Read this after `docs/project-state.md` before implementation work.

Last updated: 2026-06-10

## Active Review Findings

No active review findings are currently blocking the small/local rollout.

## Recently Resolved

### Automatic Result Import

Resolved on 2026-06-10.

The API can sync World Cup 2026 match scores and current group standings from football-data.org when `FOOTBALL_DATA_API_TOKEN` is configured. Imported records use `source = 'import'`, while manual operator result/standing writes remain `source = 'manual'` and are not overwritten by later imports.

Covered by:

- provider fixture test for raw football-data.org matches/standings response parsing;
- importer test for provider mapping, manual match-result preservation, and skipping group tables before a played match;
- route test for admin authorization and configured importer behavior.

### P2: PostgreSQL Participant Creation Race

Resolved on 2026-06-10.

PostgreSQL display-name unique violations are now mapped to a domain error. The participant entry route handles the race by re-reading the participant: matching participant codes log in normally, while mismatched codes return the existing user-facing invalid-code response.

Covered by:

- route test for a concurrent display-name creation conflict;
- repository test for mapping the PostgreSQL unique-index violation.

### P2: Empty Request Bodies Returned 500

Resolved on 2026-06-10.

Known affected routes now use `request.body ?? {}` before reading fields:

- `POST /api/rooms`
- `POST /api/rooms/:roomId/enter`
- `POST /api/rooms/:roomId/participants/enter`
- configured `POST /api/admin/login`

Covered by route tests for missing payloads returning validation or authentication responses.

### P1: Official Group Standings Were Not Saved

Resolved on 2026-06-10.

The hidden `/admin/results` screen now lets the operator reorder teams for official final group standings. Backend endpoints store those standings in `group_standing_results`, and scoring recalculates after writes.

Implemented endpoints:

- `GET /api/admin/group-standings`
- `PUT /api/admin/groups/:groupId/standings`

Covered by API tests for:

- admin authorization/validation;
- official standing persistence;
- awarding exact group-position points on the room leaderboard.

# FootballVanga Open Issues

Read this after `docs/project-state.md` before implementation work.

Last updated: 2026-06-10

## Active Review Findings

### P2: Public Room Creation Needs Spam Prevention

`POST /api/rooms` is currently public and unlimited.

Requirements say Version 1 should include a simple basic spam-prevention control before public VPS deployment.

Status: deferred while the app remains small/local; revisit before public VPS deployment.

Candidate fixes:

- operator-controlled room creation code;
- IP-based rate limit;
- max rooms per IP per day;
- unlisted rooms unless exact link/name is known.

Pick the simplest effective control for Version 1.

## Product/Data Follow-Ups

### Verify World Cup 2026 Fixtures Before Production

`docs/world-cup-2026-data.md` and the seed migration are current working references, but production deployment should re-check groups, fixtures, venues, and kickoff times against FIFA.

### Automatic Result Import

Manual operator result entry exists. Scheduled automatic result sync remains future work.

Open questions:

- Which external data source?
- What polling schedule?
- How to reconcile imported corrections with manual overrides?

## Recently Resolved

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

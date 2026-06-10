# FootballVanga Open Issues

Read this after `docs/project-state.md` before implementation work.

Last updated: 2026-06-10

## Active Review Findings

### P2: Empty Request Bodies Return 500

Several endpoints read `request.body.*` without a safe fallback to `{}`. Missing payloads currently produce internal server errors instead of validation responses.

Known affected endpoints:

- `POST /api/rooms`
- `POST /api/rooms/:roomId/enter`
- `POST /api/rooms/:roomId/participants/enter`
- configured `POST /api/admin/login`

Expected fix:

- Use `request.body ?? {}` before reading fields.
- Add route tests for missing payloads returning `400` or the existing intended auth/validation status.

### P2: Public Room Creation Needs Spam Prevention

`POST /api/rooms` is currently public and unlimited.

Requirements say Version 1 should include a simple basic spam-prevention control before public VPS deployment.

Candidate fixes:

- operator-controlled room creation code;
- IP-based rate limit;
- max rooms per IP per day;
- unlisted rooms unless exact link/name is known.

Pick the simplest effective control for Version 1.

### P2: Participant Creation Race

PostgreSQL participant creation has a check-then-insert race:

1. Two requests use the same new display name in the same room.
2. Both can pass `getParticipantByDisplayName`.
3. One insert wins; the other can fail on the unique index.
4. The loser likely returns `500` instead of a controlled participant-name/code error.

Expected fix:

- Catch unique-constraint errors around participant insert, or use an atomic insert/upsert flow.
- Return a clear `409` or existing user-facing validation error.
- Add a repository or route-level test.

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

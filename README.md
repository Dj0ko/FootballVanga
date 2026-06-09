# FootballVanga

FootballVanga is a room-based football group stage prediction game.

## Workspace

```text
apps/web       SPA frontend
apps/api       Node.js API
packages/shared shared TypeScript types and constants
docs           product and technical documentation
```

## Local Development

Install dependencies:

```bash
npm install
```

Run only the frontend for current UI work:

```bash
npm run dev -w apps/web
```

Then open:

```text
http://localhost:5173/
```

Tournament display data still comes from the local World Cup 2026 dataset. Room list, room creation, room password entry, participant entry, participant lists, and prediction reads/writes call the API. Without `DATABASE_URL`, the API uses local in-memory room, participant, and prediction storage; rooms, participants, sessions, and predictions reset after the API restarts. Set `DATABASE_URL` and run migrations when PostgreSQL-backed storage is needed.

Run both apps when backend/API work is needed:

```bash
npm run dev
```

Or run the two processes in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Build everything:

```bash
npm run build
```

Run type checks:

```bash
npm run typecheck
```

Run automated tests:

```bash
npm test
```

Run database migrations:

```bash
npm run db:migrate
```

The migration runner uses `DATABASE_URL` from the API environment and records applied files in `schema_migrations`.

## Admin Result Entry

Manual result entry is available through the hidden admin route:

```text
/admin/results
```

Admin access is checked by the API. Do not commit admin passwords. Generate server env values with:

```bash
npm run admin:hash-password
npm run admin:session-secret
```

Production values belong in `/etc/footballvanga.env`:

```text
ADMIN_PASSWORD_HASH
ADMIN_SESSION_SECRET
```

## Production Direction

The project is intended to deploy to the existing VPS stack:

- Nginx
- Node.js systemd service
- PostgreSQL
- `/opt/footballvanga`
- backend port `4100`

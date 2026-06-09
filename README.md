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

The current UI uses mocked data and does not require the API to be running.

Run both apps when backend/API work is needed:

```bash
npm run dev
```

Build everything:

```bash
npm run build
```

Run type checks:

```bash
npm run typecheck
```

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

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

Run both apps:

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

## Production Direction

The project is intended to deploy to the existing VPS stack:

- Nginx
- Node.js systemd service
- PostgreSQL
- `/opt/footballvanga`
- backend port `4100`


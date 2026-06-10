# FootballVanga Deployment Runbook

Use this runbook for the Version 1 small/local production rollout on the existing VPS stack.

## Local Release Checks

Run these before copying or pulling code on the server:

```bash
npm test
npm run typecheck
npm run build
```

Current expected production artifacts:

- API build: `apps/api/dist`
- Web build: `apps/web/dist`
- Shared package build: `packages/shared/dist`

## Server Targets

```text
SSH alias: prod-vps
App path: /opt/footballvanga
API port: 4100
systemd service: footballvanga-server
Environment file: /etc/footballvanga.env
Nginx: serves apps/web/dist and proxies /api plus /health to 127.0.0.1:4100
```

## Environment

Create `/etc/footballvanga.env` on the server. Do not commit this file.

```text
NODE_ENV=production
HOST=127.0.0.1
PORT=4100
DATABASE_URL=postgresql://footballvanga:<password>@127.0.0.1:5432/footballvanga
ADMIN_PASSWORD_HASH=<generated with npm run admin:hash-password>
ADMIN_SESSION_SECRET=<generated with npm run admin:session-secret>
FOOTBALL_DATA_API_TOKEN=<free football-data.org API token>
FOOTBALL_DATA_COMPETITION_CODE=WC
FOOTBALL_DATA_SEASON=2026
```

Generate admin values from the repo root:

```bash
npm run admin:hash-password
npm run admin:session-secret
```

## Database

Create the PostgreSQL database and role before running migrations. Example:

```bash
sudo -u postgres psql
```

```sql
CREATE USER footballvanga WITH PASSWORD '<password>';
CREATE DATABASE footballvanga OWNER footballvanga;
\q
```

Then run migrations with the production environment loaded:

```bash
cd /opt/footballvanga
set -a
. /etc/footballvanga.env
set +a
npm run db:migrate
```

The migration runner creates `schema_migrations` and applies:

- `0001_initial_schema.sql`
- `0002_seed_world_cup_2026_group_stage.sql`

## Build On Server

```bash
cd /opt/footballvanga
npm ci
npm run build
```

Generate precompressed static assets for Nginx `gzip_static`:

```bash
find /opt/footballvanga/apps/web/dist -type f \
  \( -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.svg" -o -name "*.json" \) \
  -exec gzip -kf9 {} \;
```

## systemd

Create `/etc/systemd/system/footballvanga-server.service`:

```ini
[Unit]
Description=FootballVanga API
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/footballvanga
EnvironmentFile=/etc/footballvanga.env
ExecStart=/usr/bin/npm run start:api
Restart=always
RestartSec=5
User=footballvanga
Group=footballvanga

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable footballvanga-server
sudo systemctl restart footballvanga-server
sudo systemctl status footballvanga-server --no-pager
```

Logs:

```bash
sudo journalctl -u footballvanga-server -f
```

## Result Import Timer

Automatic result sync uses the free football-data.org API token from `/etc/footballvanga.env`.

Manual one-shot run after the API build exists:

```bash
cd /opt/footballvanga
set -a
. /etc/footballvanga.env
set +a
npm run import:results
```

Create `/etc/systemd/system/footballvanga-result-import.service`:

```ini
[Unit]
Description=FootballVanga result import
After=network-online.target postgresql.service

[Service]
Type=oneshot
WorkingDirectory=/opt/footballvanga
EnvironmentFile=/etc/footballvanga.env
ExecStart=/usr/bin/npm run import:results
User=footballvanga
Group=footballvanga
```

Create `/etc/systemd/system/footballvanga-result-import.timer`.

If the VPS timezone is `Europe/Moscow`, use:

```ini
[Unit]
Description=Run FootballVanga result import four times per day

[Timer]
OnCalendar=*-*-* 02:45:00
OnCalendar=*-*-* 06:15:00
OnCalendar=*-*-* 09:45:00
OnCalendar=*-*-* 22:45:00
Persistent=true
AccuracySec=1min
Unit=footballvanga-result-import.service

[Install]
WantedBy=timers.target
```

If the VPS timezone is UTC, use the converted schedule instead:

```ini
[Unit]
Description=Run FootballVanga result import four times per day

[Timer]
OnCalendar=*-*-* 03:15:00
OnCalendar=*-*-* 06:45:00
OnCalendar=*-*-* 19:45:00
OnCalendar=*-*-* 23:45:00
Persistent=true
AccuracySec=1min
Unit=footballvanga-result-import.service

[Install]
WantedBy=timers.target
```

Enable the timer:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now footballvanga-result-import.timer
sudo systemctl list-timers footballvanga-result-import.timer --no-pager
```

Logs:

```bash
sudo journalctl -u footballvanga-result-import.service -n 50 --no-pager
```

The hidden admin screen also has a manual `Sync` button. Imported rows use `source = 'import'`; manual operator result and standing writes use `source = 'manual'` and are not overwritten by later imports.

## Nginx

Example server block. Replace `footballvanga.example.com` with the real domain.

Create `/etc/nginx/snippets/footballvanga-security-headers.conf`:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'" always;
```

```nginx
server {
  listen 80;
  server_name footballvanga.example.com;

  root /opt/footballvanga/apps/web/dist;
  index index.html;

  gzip on;
  gzip_static on;
  gzip_vary on;
  gzip_comp_level 6;
  gzip_min_length 1024;
  gzip_types
    text/plain
    text/css
    application/json
    application/javascript
    application/xml
    image/svg+xml;

  location ^~ /assets/ {
    include /etc/nginx/snippets/footballvanga-security-headers.conf;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:4100;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /health {
    proxy_pass http://127.0.0.1:4100;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    include /etc/nginx/snippets/footballvanga-security-headers.conf;
    add_header Cache-Control "no-cache";
    try_files $uri $uri/ /index.html;
  }
}
```

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

If HTTPS is configured separately, keep `NODE_ENV=production` so admin cookies include `Secure`.

## Smoke Checks

From the server:

```bash
curl -fsS http://127.0.0.1:4100/health
curl -fsS http://127.0.0.1:4100/api/meta
curl -fsS http://127.0.0.1:4100/api/tournament > /tmp/footballvanga-tournament.json
```

From a browser after Nginx is live:

- Open the public app.
- Create a room.
- Enter room password.
- Create a participant.
- Save a prediction.
- Open `/admin/results`.
- Log in as admin.
- Save one match result or official group standing only when ready.
- If `FOOTBALL_DATA_API_TOKEN` is configured, run manual `Sync` and confirm the summary is shown.
- Confirm leaderboard recalculation still works.

## Rollback

Keep the previous deployed commit available. For a simple rollback:

```bash
cd /opt/footballvanga
git checkout <previous-commit>
npm ci
npm run build
sudo systemctl restart footballvanga-server
sudo nginx -t
sudo systemctl reload nginx
```

Database migrations are forward-only. Take a PostgreSQL backup before applying new migrations once real user data exists.

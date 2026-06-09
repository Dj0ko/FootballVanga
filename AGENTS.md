# FootballVanga

## Project Context

FootballVanga is a fast-moving football prediction project intended to be deployed to a server.

## Working Notes

- Keep changes small and easy to review.
- Prefer existing project conventions once the app stack is chosen.
- Before deployment, verify build, environment variables, and server configuration.
- Read `docs/project-state.md` before continuing product or implementation work.

## Local App Policy

- Do not start the local application or dev server unless the user explicitly asks for it.
- Do not open, reload, or test the local app in a browser unless the user explicitly asks for it.
- Non-interactive checks such as `npm test`, `npm run typecheck`, `npm run build`, `git status`, and `git diff` are allowed when they are useful for code changes.

## Current Implementation Notes

- The current frontend has a welcome screen followed by an API-backed rooms flow and mocked participant/prediction workspace.
- The frontend currently uses backend API calls for room list, room creation, and room password entry.
- The frontend still uses local mock data in `apps/web/src/data/mockFootball.ts` for tournament display, participants, predictions, and leaderboards.
- Backend is not required for prediction-workspace UI-only checks, but room flows require the API. Without `DATABASE_URL`, the API uses in-memory room storage; with `DATABASE_URL`, it uses PostgreSQL after migrations.
- For UI-only local work, use `npm run dev -w apps/web` and open `http://localhost:5173/`.
- The root `npm run dev` starts both web and api and is not needed for current UI-only checks.

# FootballVanga

## Project Context

FootballVanga is a fast-moving football prediction project intended to be deployed to a server.

## Working Notes

- Keep changes small and easy to review.
- Prefer existing project conventions once the app stack is chosen.
- Before deployment, verify build, environment variables, and server configuration.
- Read `docs/project-state.md` before continuing product or implementation work.
- After code changes, assess whether the existing automated tests cover the changed behavior. If extra tests are needed or a meaningful coverage gap remains, tell the user explicitly instead of treating the current checks as enough.

## Local App Policy

- Do not start the local application or dev server unless the user explicitly asks for it.
- Do not open, reload, or test the local app in a browser unless the user explicitly asks for it.
- Non-interactive checks such as `npm test`, `npm run typecheck`, `npm run build`, `git status`, and `git diff` are allowed when they are useful for code changes.

## Current Implementation Notes

- The current frontend has a welcome screen followed by an API-backed rooms/participant flow and an API-backed prediction workspace.
- The frontend currently uses backend API calls for tournament display data, room list, room creation, room password entry, participant entry, room participant lists after participant entry, room leaderboards, global top-5 leaderboard, match history, and prediction reads/writes.
- The frontend should not use local mock data for current product data.
- Prediction reads/writes, tournament display data, room leaderboards, global leaderboard, match history, room, and participant flows require the API. Without `DATABASE_URL`, the API uses in-memory room, participant, prediction, match result, and scoring storage plus a backend static tournament fallback; match history starts empty until admin/imported results are saved. With `DATABASE_URL`, it uses PostgreSQL after migrations.
- For isolated UI-only component/CSS work that does not need API data, use `npm run dev -w apps/web` and open `http://localhost:5173/`.
- The normal app flow requires the API; the root `npm run dev` starts both web and api and should be used only when explicitly requested.

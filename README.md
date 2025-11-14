
# Portail Étudiants (EMSE)

This repository contains the SvelteKit-based student portal for EMSE: a small web app to list associations, manage events, export calendar data (ICS), and provide basic authentication and APIs.

This README explains the project's purpose, how to run it locally, how to test and build it, environment variables required, and common troubleshooting tips.

## Purpose
- Central directory for student associations
- Calendar of events and ICS export
- API endpoints for associations, events and users
- Authentication using `@auth/sveltekit`
- Responsive UI implemented with SvelteKit

## Quick start (local development)

Prerequisites
- Bun (or Node 18+). The project is configured with Vite / SvelteKit.
- A MySQL-compatible database (or a running instance for API routes)

1. Bun installation (if not already installed)
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Install dependencies

```bash
bun install
# or: bun install
```

3. Create a local `.env` file (see `.env.example`)

4. Run the dev server

```bash
bun run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

Notes
- For frontend-only development you can stub or mock API responses if the DB isn't available.

## Environment variables
Create a `.env` file with the variables listed in `.env.example`. Key variables used by the code:

- `DB_HOST` — database host
- `DB_USER` — database username
- `DB_PASSWORD` — database password
- `DB_NAME` — database name
- `DB_PORT` — database port (optional, default 3306)
- `AUTH_SECRET` — secret used by the authentication library (if configured)

CI/CD deploy secrets (for optional GitHub Action deploy workflow):
- `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `SSH_PORT`, `REMOTE_PATH`

See `.env.example` for a template.

## Scripts
- `bun run dev` — start dev server
- `bun run build` — production build
- `bun run preview` — preview the production build locally
- `bun run check` — run svelte-check / typecheck

## Testing
- Unit tests: Vitest is configured in the repo. Run with `bunx vitest`.
- Example API tests exist under `tests/api/` and components tests under `tests/components/`.
- Manual API checks:
	- `GET /api/associations` — should return JSON list of associations (with `icon` URLs)
	- `GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` — returns events in range
	- `GET /api/calendar/ics` — download ICS file for upcoming events

## APIs (overview)
- `GET /api/associations` — list associations (processed to include icon URLs)
- `POST /api/associations` — create association (requires auth)
- `GET /api/calendar` — events query by range and optional associationId
- `GET /api/calendar/ics` — ICS export of upcoming events
- `GET /api/user/[id]` — user data

Explore `src/routes/api` for the full list of endpoints.

## Database
- The app uses `mysql2/promise`. Database helper is in `src/lib/server/database.ts`.
- The helper `db` is a template literal function that parameterizes values (safe queries).
- Types are in `src/lib/databasetypes.d.ts`. Database rows (Raw types) are transformed into processed types for the frontend.

## Security notes
- Always use prepared queries or `escape()` when building SQL queries. This repo uses both the `db` template helper and explicit `escape()` in places with dynamic SQL.
- Protect auth secrets and database credentials. Don't commit `.env` to git.

## CI / CD
- A GitHub Actions workflow `/.github/workflows/deploy.yml` (example) uploads build output to a server via SSH and restarts the app (example using `pm2`). Configure the required repository secrets before enabling the workflow.

## Troubleshooting
- `associations is null` on page: ensure the `+page` load function returns `associations` and the API `GET /api/associations` returns processed objects (including `icon` URL). See `src/routes/api/associations/+server.ts`.
- `ENOENT: no such file or directory` for `databasetypes`: import types using `import type` and reference the `.d.ts` file if needed.
- DB connection errors: verify `.env` values and that MySQL is running.

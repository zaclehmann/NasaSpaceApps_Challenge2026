<!-- AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann. -->
# apps/server

The MissionVitals API: everything the astronaut does, stored per browser session in Postgres (Supabase).

- `src/handlers.ts`: one plain function per endpoint, with input checked by the zod schemas in `packages/shared/src/api`. Statuses and alerts come from the shared session engine, rebuilt from the session's rows.
- `src/router.ts`: maps `/api/<path>` to a handler and turns errors into status codes (400, 404, 413, 429, generic 500).
- `src/supabaseStore.ts`: storage on Supabase with the service key; `src/memoryStore.ts`: the same in memory, for tests.
- `src/vercel.ts`: the HTTP adapter, bundled into `api/_server.mjs` for the Vercel function `api/router.js`.
- `supabase/migrations`: the schema (row-level security on, no public policies) and the stale-session cleanup.

Endpoints: `GET /api/health`, `GET /api/state`, `POST /api/session`, `/api/readings`, `/api/symptoms`, `/api/symptoms/:id/resolve`, `/api/routine/complete`, `/api/routine/postpone`, `/api/alerts/:id/acknowledge`, `/api/alerts/:id/actions`, `/api/reports`, `/api/demo`.

Run it locally: put the two Supabase values in `.env.local` (see the root README), then `npm run dev:api` (port 3001) next to `npm run dev`. Tests: `npm test -w @missionvitals/server`. Smoke test: `npm run smoke:api [url]`.

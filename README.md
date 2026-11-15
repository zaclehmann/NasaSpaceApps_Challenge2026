<!-- AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann. -->
# MissionVitals

A tablet-first web app where an astronaut on a long mission checks their own health, understands what the numbers mean, and knows what to do, without waiting for Earth.

Solo entry by Zac Lehmann for the NASA Space Apps Challenge 2026: "Create Health Monitoring Software for Astronauts on Space Missions".

This phase is the interface only. All data is simulated, every threshold is a demo value, and nothing here is medical advice or a NASA limit.

## Run it

Needs Node 20 or later.

```
npm install
npm run dev
```

Then open http://localhost:5173.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build of the web app |
| `npm run typecheck` | Type-check both packages |
| `npm test` | Unit tests for the status function |
| `npm run check:supabase` | Check that the Supabase project in `.env.local` can be reached |
| `npm run dev:api` | Local API on port 3001 (needs `.env.local`). With `npm run dev` alongside, the app uses it (server mode) |
| `npm run dev:full` | Web and API together with `vercel dev` (needs the Vercel CLI, logged in and linked) |
| `npm run build:api` | Bundle the API into `api/_server.mjs` for the Vercel function (part of `npm run build`) |
| `http://localhost:5173/?local=1` | Force local mode: the in-browser simulator, no server (for recording the video) |

## Configuration

The web app runs without any configuration. The server work (in progress) needs a Supabase project:

1. Copy `.env.example` to `.env.local`. It is git-ignored.
2. The URL is already filled in. Add `SUPABASE_SERVICE_ROLE_KEY` from Supabase › Project Settings › API in project `NASA_Space_Apps` (the service_role key, shown on newer projects as a secret key starting `sb_secret_`).
3. Run `npm run check:supabase`. It should print "Supabase reachable".

The service role key is server-only. It must never go into `apps/web`, a `VITE_` variable, a commit, a screenshot or a chat.

## Demo

- The app opens on a crew picker. Choose Hana Park to see the default scenario (heart rate after exercise, Caution).
- **Demo** in the header opens the demo controls: seven scenarios, the Earth link switch, the sleep-period switch (automatic dark mode), a theme override and an astronaut switch.
- Links can set the state directly, for example `/?astronaut=hana&scenario=low-spo2&theme=dark`. Scenario ids: `normal`, `hr-exercise`, `low-spo2`, `high-bp`, `mood-falling`, `sensor-dropout`, `solar-event`.
- `/kit` shows every token, badge, button and input in light and dark. It is served only by `npm run dev`, not in a production build.
- Text still to be written shows as `TODO(Zac)` notes on the Learn and Methodology pages while developing. A production build hides them.

## Structure

```
docs/ui.md            Design spec.
docs/ui-rework-notes.md  What the 14 Nov rework changed, and where it now differs from the spec.
apps/web              React + Vite + TypeScript + Tailwind CSS v4
  src/data            DataSource interface, seeded mock, React provider and hooks
  src/components      layout, status, indicators, body, panel, measure, charts, report, demo, ui
  src/pages           CrewPicker, MyHealth, CrewOverview, Learn, Methodology, Kit
apps/server           Planned onboard Node API, not built (see its README)
packages/shared       Types, indicator catalogue, demo thresholds, status function, guidance, routine
screenshots           My Health at three sizes, light and dark, four scenarios
```

All data goes through `apps/web/src/data/DataSource.ts`. Components use the hooks in `DataProvider.tsx` and never import the mock, so a Node API client can replace `mockSource.ts` without touching them.

## AI use

The Space Apps rules ask for AI-generated work to be acknowledged.

- **Generated with Claude Code (Anthropic), then reviewed and edited by Zac Lehmann:** the source code in `apps/web` and `packages/shared`, including the React components, the mock data generator, the status function and its tests, the body figure drawing and this README. Each source file starts with a comment saying so, and the package descriptions and page metadata repeat it.
- **Drafted with AI and checked against the listed sources:** the guidance text in `packages/shared/src/guidance.ts`.
- **Zac's own:** the concept, the scope, and the design decisions in `docs/ui.md`.
- Text still to be written by Zac is marked `TODO(Zac)` in the Learn and Methodology pages.

## NASA data used

| Source | What it's used for |
| --- | --- |
| [NASA HRP, 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) | Groups the indicators by hazard on the Learn page, and the "Why it changes in space" text |
| [NASA HRP, Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) | The named NASA risk shown for each indicator |
| [NASA alert design guidance, Commercial LEO Destinations HSI workshop](https://ntrs.nasa.gov/api/citations/20240003565/downloads/CLD%20HSI%20Workshop%20Alerts.pdf) | Alert levels, acknowledgement and silencing an alarm by acting on it |
| [NASA DONKI space weather database](https://ccmc.gsfc.nasa.gov/DONKI/) (CCMC), May 2024 solar storm | The solar storm scenario replays the real flares, CMEs and GOES particle arrivals (>10 MeV on 10 May, >100 MeV on 11 May 2024) with their real timing. The habitat dose rate is simulated, since DONKI records events, not dose. Data in `packages/shared/data/donki-2024-05.json`, downloaded once with `npm run fetch:donki` from the DONKI web service at `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/`. |

## Sources

- NASA HRP, 5 Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- NASA HRP, Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/
- CSA, Bio-Monitor: https://www.asc-csa.gc.ca/eng/sciences/astroskin.asp
- CSA, Monitoring radiation for astronaut health: https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- Theme tokens: 21st.dev Vercel theme. Typeface: Geist and Geist Mono, SIL Open Font License (`apps/web/src/assets/fonts/OFL.txt`).

No NASA logo, flag or insignia is used.

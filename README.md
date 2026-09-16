# Gym

A self-hosted workout planner and logger. Give it your goals, available equipment, and any
current injuries — a deterministic rules engine designs your split and picks exercises around
them, no external API required. Log sets from your phone mid-workout as an installable PWA.

## Stack

SvelteKit (Node adapter) + TypeScript, SQLite via Drizzle ORM, Tailwind CSS, Vite PWA plugin.
See [src/lib/server/engine](src/lib/server/engine) for the workout-generation rules engine.

## Local development

Requires Node.js 20+.

```sh
npm install
npm run db:migrate   # creates ./data/gym.db and applies the schema
npm run db:seed      # seeds the tag taxonomy + exercise library
npm run dev -- --host   # --host lets you test from a phone on the same LAN
```

Run the test suite (mainly the rules engine — the highest-risk logic):

```sh
npm test
```

Typecheck:

```sh
npm run check
```

## Deploying to a Raspberry Pi

1. Copy this repo to the Pi (or `git clone` it there) and `cd` into it.
2. Copy `.env.example` to `.env`. The defaults are already Docker-correct; set `APP_PIN` if
   you want a lightweight PIN gate.
3. Build and start:

   ```sh
   docker compose up -d --build
   ```

   The container applies any pending database migrations automatically on startup, then
   serves on port 3000. `./data/gym.db` on the host persists across rebuilds — back it up by
   copying that file (and its `-wal`/`-shm` siblings) periodically, e.g. via cron.

4. Install [Tailscale](https://tailscale.com/) on the Pi and on your phone, and put both on
   the same tailnet. Reach the app from anywhere at `http://<pi-tailscale-name>:3000` — no
   port forwarding or public exposure needed. No app-specific configuration is required for
   this; the app just binds `0.0.0.0:3000` and Tailscale handles the networking.
5. From your phone's browser, open that URL and use "Add to Home Screen" to install it as a
   standalone app.

To update after pulling new changes:

```sh
git pull
docker compose up -d --build
```

### Health check

`GET /health` returns `{"status":"ok"}` and is what the Docker healthcheck polls.

## Project layout

- `src/lib/server/db/schema.ts` — Drizzle schema (goals, injuries, exercises, plans, sessions, logged sets)
- `src/lib/server/db/seed/` — tag taxonomy + exercise library seed data
- `src/lib/server/engine/` — the rules engine: split selection, exercise selection (equipment/injury filtering), progressive overload
- `src/lib/server/repositories/` — data access wired to the engine
- `src/routes/api/` — REST endpoints consumed by the frontend
- `src/routes/` — onboarding wizard, Today (logging), Plan, Progress, Settings
- `src/lib/client/offline/` — IndexedDB outbox for offline-tolerant set logging

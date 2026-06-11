# Yaaran E Ilm

A Pakistani online tutoring platform where students and tutors can connect, share educational videos, and book classes — with a focus on O/A Level education.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/yaaran-e-ilm run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + Wouter routing + Framer Motion
- API: Express 5 + express-session (SHA-256 hashed passwords)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — DB schema: users, tutors, videos, classes, enrollments
- `artifacts/api-server/src/routes/` — API routes: auth, tutors, videos, classes, stats
- `artifacts/yaaran-e-ilm/src/` — React frontend

## Architecture decisions

- Session-based auth using express-session + SHA-256 password hashing (no external auth provider)
- Both students and tutors can upload videos; tutors can additionally create classes
- Videos reference YouTube URLs for embedding; thumbnails use YouTube's CDN
- Platform stats endpoint aggregates counts across all tables for the home page dashboard
- isFree stored as integer (0/1) in DB for PostgreSQL compatibility with Drizzle

## Product

- **Landing page** — platform stats, featured videos, top tutors, CTAs
- **Registration** — separate flows for students and tutors (tutors choose subject/level)
- **Video Library** — all educational videos, filterable by subject and level
- **Tutors Directory** — browse and filter tutors, view profiles
- **Classes** — browse and enroll in live classes hosted by tutors
- **Upload** — both students and tutors can upload educational videos
- **Dashboard** — personalized view after login with recent activity

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before checking artifact packages
- After changing `lib/api-spec/openapi.yaml`, run codegen before touching the frontend
- The `isFree` field in classesTable is stored as integer (1=true, 0=false) — convert when building response objects

## Seed data

Three tutors (Ahmad Khan/Mathematics, Fatima Malik/Physics+Chemistry, Bilal Hassan/English) and two students are seeded with password `pass123`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

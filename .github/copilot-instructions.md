
# Copilot Instructions for AI Coding Agents

## Project Scope & Knowledgebase
- This project is a Docker-orchestrated Next.js app with Supabase/Postgres backend, using PostgREST and GoTrue for API/auth.
- **Ignore all files in `llm-vibes/`.**
- The canonical documentation is the Knowledgebase in `guide/kb/` (see `kb-0000-index-overview.md`).
  - Each KB file is concise, focused, and linkable. Use KB articles for architecture, operations, schema, API, and frontend details.
  - When referencing project context, cite KB filenames (e.g., `kb-1010-architecture-overview`).

## Context Summary
- See `guide/llm-context.md` for a summary of stack, KB usage, and coding guidelines.
  - Stack: Postgres, GoTrue, PostgREST, Next.js (shadcn/ui, TanStack Query/Form).
  - Always prefer step-by-step, command-level fixes. If missing context, ask for the verbatim file.

## Architecture & Data Flow
- All major components and data flows are described in `kb-1010-architecture-overview.md`.
  - Services: Postgres (db), GoTrue (auth), PostgREST (api), Next.js (web).
  - All services run in Docker containers, orchestrated by `docker-compose.yml`.
  - Next.js frontend uses App Router, talks directly to PostgREST (no custom API routes), manages auth via GoTrue.

## Developer Workflows
- Build, run, and deploy using scripts in `docker/` and `scripts/`.
  - Use VS Code tasks: `Sync to docker host`, `Dry-Sync to docker host`, `docker npm (ps1)`.
  - Database migrations: see `docker/supabase/migrations/` and `start.sh` (see `kb-2010-operations-environment-and-scripts.md`).
  - Debugging: hot-reload via `nodemon.json`, logging via `lib/logDebug.ts`.

## Conventions & Patterns
- Feature folders are singular (e.g., `assets/`, `auth/`). Shared code uses `_` prefix (`_components/`, `_hooks/`).
- Environment variables managed via Docker Compose and scripts. WSL integration for cross-platform scripting.
- All browser requests use `lib/fetch-timeout.ts` for 15s timeout (see ADR-002).

## API & Frontend
- Next.js frontend details: see `kb-5010-nextjs-app-overview.md`.
  - Auth via `@supabase/gotrue-js`, data via PostgREST, React Query for fetching, Tailwind + shadcn/ui for styling.
  - Key files: `app/_components/whoami.tsx`, `app/applications/page.tsx`, `app/api/[...path]/route.ts`, `lib/browser/api-isms.ts`.
- API details: see `kb-4010-api-overview.md`.
  - All helpers return arrays for list/insert, null for DELETE. Use schema headers and JWT for requests.

## Documentation & Troubleshooting
- For onboarding, troubleshooting, and reference, use the Knowledgebase in `guide/kb/` and developer notes in `guide/`.
- If you need exact file contents, ask for the verbatim file.

---
Update this file as project conventions evolve. Feedback welcome!

--- 
title: Reference History (Decisions & Changelog) 
tags: [reference, adr, history, changelog, decisions] 
related: [kb-0000-index-overview, kb-1010-architecture-overview] 
--- 
 
# Decisions 
* ADR-001: Use `@supabase/gotrue-js` (not `@supabase/supabase-js`) for pure auth in self-hosted setup. 
* ADR-002: Enforce 15s timeout on all network calls via shared wrapper. 
* ADR-003: Favor PostgREST over custom Next API routes. 
* ADR-004: Use same-origin proxy paths `/auth` and `/api` to the Next.js App Router to eliminate CORS. Proxies are transparent (no business logic). Application logic remains in PostgREST/RPC. 
* ADR-005: Prefer PostgREST **embedding** for read-time relationships (e.g., `owner:ownership(name)`) to reduce client joins and keep authorization evaluation on the server. Writes still pass foreign keys (e.g., `owner_id`). 
 
# Changelog 
[2025-09-27] UI refactor pattern adopted. 
  - Split pages into DisplayRow / EditorRow / CreateForm. 
  - Domain hooks in app/_hooks with central queryKeys. 
  - Shared types, domain API in lib/browser/<domain>. 
[2025-09-28] use nodemon dev server using documented Windows+Docker dev HMR fix (WATCHPACK_POLLING).

--- 
title: Reference History (Decisions & Changelog) 
tags: [reference, adr, history, changelog, decisions] 
related: [kb-0000-index-overview, kb-1010-architecture-overview] 
--- 
 
* ADR-001: Use `@supabase/gotrue-js` (not `@supabase/supabase-js`) for pure auth in self-hosted setup. 
* ADR-002: Enforce 15s timeout on all network calls via shared wrapper. 
* ADR-003: Favor PostgREST over custom Next API routes. 
* ADR-004: Use same-origin proxy paths `/auth` and `/api` to the Next.js App Router to eliminate CORS. Proxies are transparent (no business logic). Application logic remains in PostgREST/RPC.
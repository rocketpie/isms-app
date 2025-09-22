--- 
title: API Overview (PostgREST & RPC) 
tags: [api, postgrest, rpc, routes, security, rls] 
related: [kb-3010-schema-overview, kb-5010-nextjs-app-overview, kb-4010-api-overview] 
--- 
 
# RPC Examples 
- `app.whoami` usage and sample response display in `whoami.tsx`. 
 `app.whoami()` (SECURITY DEFINER) returns a single JSON object with: 
   { 
     "email": app.jwt_email(), 
     "app_role": app.jwt_claims() -> 'app_metadata' ->> 'role', 
     'claims', app.jwt_claims() 
   } 
 UI should **display app_role** (fallback to 'authenticated'). 

- `app.admin_grant_app_role(target_email, new_role)` preconditions (caller_role `admin`). 
  caller_role := (app.jwt_claims() -> 'app_metadata' ->> 'role'); 
  

# Browser helpers
- `lib/browser/api-isms` → `/api` base, sets `Accept-Profile/Content-Profile: isms`, attaches JWT, `no-store`, 15s timeout. 
- `lib/browser/api-app`  → `/api` base, sets `Accept-Profile/Content-Profile: app`, attaches JWT, `no-store`, 15s timeout. 
 
# Backend helper
- `lib/backend/postgrest` → `INTERNAL_POSTGREST_URL` base, schema header per call (`'isms' | 'app'`), optional token, `no-store`, 15s timeout. 
 
# Config
- `lib/browser/config.ts` → `getApiUrl() -> '/api'`, `getAuthUrl() -> '/auth'`. 
- `lib/backend/config.ts` → validates `INTERNAL_POSTGREST_URL` / `INTERNAL_GOTRUE_URL`, exports `IsDebug` = process.env.DEBUG. 
 
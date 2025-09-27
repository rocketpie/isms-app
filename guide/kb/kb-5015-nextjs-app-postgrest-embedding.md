--- 
title: Frontend – PostgREST Embedding for Reads 
tags: [nextjs, postgrest, embedding, react-query, rls] 
related: [kb-5010-nextjs-app-overview, kb-5012-nextjs-app-isms-pages, kb-4010-api-overview, kb-3030-schema-isms, kb-9910-reference-history] 
--- 
 
# Decision 
Use PostgREST **embedding** in read endpoints to fetch related labels (e.g., ownership names) in one call: 
`GET /applications?select=id,name,description,owner_id,owner:ownership(id,name)&order=name.asc` 
 
# Why 
- Fewer client concerns (no ID→name maps, simpler caches). 
- Joins happen server-side under RLS, keeping auth centralized. 
- Aligns with our ADR to favor PostgREST shaping over custom routes. 
 
# Scope 
- Reads: use **embedded selects** for nice UI labels. 
- Writes: send **foreign keys** only (eg. `owner_id`), never nested objects. 
- Use `Prefer: return=representation` for POST/PATCH to hydrate UI with server-truth. 
- Use **optimistic updates** in React Query; always `invalidateQueries` on settle. 
 
# Impact 
- Reduced UI complexity and less invalidation glue. 
- Clearer React Query caches (one list contains what we render). 
- Maintain performance by selecting only required columns from related tables. 
 
# Exapmle 
```ts 
// Read (embed) 
GET /process_applications?process_id=eq.${encodeURIComponent(processId)}&select=process_id,application_id,application:applications(id,name,description,owner:ownership(id,name))&order=application(name).asc 
 
// Create (FK only) 
POST /processes 
[{ "process_id": "<uuid>", "application_id": "<uuid>" }]) 
Prefer: return=representation 
``` 
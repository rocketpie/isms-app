---
title: Frontend – PostgREST Embedding for Reads
tags: [nextjs, postgrest, embedding, react-query, rls]
related: [kb-5010-nextjs-app-overview, kb-4010-api-overview, kb-3030-schema-isms, kb-9910-reference-history]
---

# Decision
Use PostgREST **embedding** in read endpoints to fetch related labels (e.g., ownership names) in one call:
`GET /applications?select=id,name,description,owner_id,owner:ownership(id,name)&order=name.asc`

# Why
- Fewer client concerns (no ID→name maps, simpler caches).
- Joins happen server-side under RLS, keeping auth centralized.
- Aligns with our ADR to favor PostgREST shaping over custom routes.

# Scope
- **Reads**: embed minimal related fields needed for display.
- **Writes**: continue sending foreign keys (`owner_id`), not nested objects.
- For edit UIs that need selection lists, keep a separate query to `/ownership?select=id,name`.

# Impact
- Reduced UI complexity and less invalidation glue.
- Clearer React Query caches (one list contains what we render).
- Maintain performance by selecting only required columns from related tables.

---
title: Row Level Security
tags: []
relates_to: []
---

**Table policies**:

\\\sql
-- enable RLS and add basic self-access policies
-- (replace table/column names)
\\\

 * Roles: `authenticated` (read), `editor` (CRUD), `admin` (app-level via JWT metadata).
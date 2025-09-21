---
title: Env Variables
tags: []
relates_to: []
---

**docker/.env**
BASE_HOST=dockerhost
WEB_PORT=7770
API_PORT=7771
AUTH_PORT=7779

POSTGRES_USER=postgres
POSTGRES_PASSWORD=placeholder
POSTGRES_DB=postgres

# PostgREST 
AUTHENTICATOR_PASSWORD=placeholder
PGRST_DB_SCHEMAS=isms,app
PGRST_DB_ANON_ROLE=anon

# GoTrue <-> PostgREST
JWT_SECRET=REPLACE_ME_super_random_256bit
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=true


**docker/web/.env.local**
NEXT_PUBLIC_GOTRUE_URL=http://dockerhost1:7779
NEXT_PUBLIC_POSTGREST_URL=http://dockerhost1:7771
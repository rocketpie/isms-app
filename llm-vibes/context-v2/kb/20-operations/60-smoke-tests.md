---
title: Smoke Tests
tags: []
owner: devops
updated: 2025-09-21
relates_to: []
---**Goal**: Prove the stack is healthy.

1) DB reachable  
\\\ash
psql  -c "select 1"
\\\

2) GoTrue health  
\\\ash
curl -f http://localhost:9999/health
\\\

3) Auth flow → PostgREST (fill in endpoints)
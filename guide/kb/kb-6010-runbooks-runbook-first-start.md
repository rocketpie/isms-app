---
title: Runbook – First Start
tags: [runbook, operations, startup, local-dev]
related: [kb-2010-operations-environment-and-scripts, kb-2015-operations-test-details, kb-1010-architecture-overview]
---

# Steps to run the entire stack
- set env vars,
- start.sh
- visit `/` on WEB_PORT (eg. 7770) 
- sign up
- grant `editor`
- edit ISMS data.

# Step for local dev
- start docker desktop
- set env vars
- run vscode task `sync to docker host`
- on docker host, run start.sh
- on docker host, run test.sh
- run vscode task `docker npm (ps1)`
- run `npm run dev`
- visit http://localhost:3000/
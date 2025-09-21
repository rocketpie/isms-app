---
title: Data Flow Requests
tags: []
relates_to: []
---

**Purpose**: High-level view.

* Auth flow (sign in → localStorage session → JWT added by `api.ts`).
* Data fetch flow (React Query → `pgrst()` → PostgREST with `Accept-Profile: isms`).
* Error/timeout handling (AbortController 15s).
--- 
title: Next.js App ISMS Page Details 
tags: [nextjs, isms, frontend, react-query, postgrest] 
related: [kb-5010-nextjs-app-overview, kb-5015-nextjs-app-postgrest-embedding, kb-1010-architecture-overview] 
--- 
 
# Data flow (page → hook → helper → PostgREST) 
1. Page is **presentational**: composes rows/sections. 
2. Feature **hook** owns cache keys, optimistic updates, invalidations. 
3. **Helper** hits PostgREST, shapes read embeds, FK writes. 
4. RLS enforced by service; client only shapes requests. 
 
# Componentization rules (pages → components) 
- Split pages into: 
  - `DisplayRow` (read-only view) 
  - `EditorRow` (inline edit) 
  - `CreateForm` (new row) 
- Feature sub-sections (e.g., `LinkedApplications`) 
- Move data-fetching/mutations into feature hooks under `app/_hooks/*`. 
- Share types and API calls under `lib/browser/isms/*` (eg. `lib/browser/isms/ownership.ts`). 
 
 
# Standard layout 
``` 
lib/ 
  browser/ 
    api-isms.ts               # PostgREST wrapper 
    isms/ 
      ownership.ts            # ownership types/list/create/update/delete 
      processes.ts            # process types/list/create/update/delete 
      applications.ts         # applications types/list/create/update/delete 
      process-applications.ts # linking helper types/list/create/delete 
      ... 
 
app/ 
  _hooks/ 
    queryKeys.ts             # central keys 
    useProcesses.ts          # feature hook 
    useApplications.ts       # feature hook 
    useProcessApplications.ts 
    ... 
 
  processes/                 # example asset page 
    page.tsx 
    _components/ 
      DisplayRow.tsx 
      EditorRow.tsx 
      CreateForm.tsx 
      LinkedApplications.tsx 
``` 
 
```ts 
// app/_hooks/queryKeys.ts 
export const queryKeys = { 
  ownership: ['ownership'] as const, 
  allProcesses: ['processes'] as const, 
  allApplications: ['applications', 'all'] as const, 
  processApplications: (processId: string) => 
    ['process', processId, 'applications'] as const, 
  ... 
}; 
``` 
 
# Testing components & hooks 
 
## Hooks 
* Unit-test `useProcesses` and `useProcessApplications` with a **mocked `postgrest`** helper. 
* Assert: optimistic update behavior, invalidations, error rollbacks. 
 
## Components 
* Test `ProcessCreateForm`: 
  * Renders while owners are loading. 
  * Submits name-only, optional description/owner. 
  * Clears fields on success and calls `onCreated`. 
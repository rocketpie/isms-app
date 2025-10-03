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
 
 
# file index 
``` 
app/
  error.tsx  # Error boundary, runtime errors
  globals.css
  layout.tsx  # Root layout: header, navigation, authentication buttons
  page.tsx  # Main page: API and Auth info
  providers.tsx  # React Query provider for the app
  _components/
    assetPageHeader.tsx  # Navigation header for asset-related pages
    ownerSelect.tsx  # Owner selection dropdown component
    whoami.tsx  # Component to display the current user's email and role
  _hooks/
    queryKeys.ts  # Centralized query keys for React Query
    useAssetLinks.ts  # asset-link specific implementations using useAssetLinksBase
    useAssetLinksBase.ts  # generic hooks for managing asset links with React Query
    useAssets.ts  # asset-type-specific implementations using useAssetsBase
    useAssetsBase.ts  # generic hooks for managing assets with React Query
  api/
    [...path]/
      route.ts  # API proxy to internal PostgREST service
  assets/
    layout.tsx  # adds AssetPageHeader to all asset pages
    _components/
      EmptyState.tsx
      ErrorBanner.tsx
      LinkedAssetsSection.tsx  # generic display, modify linked assets
      LoadingLine.tsx
      SimpleAssetCreateForm.tsx  # Generic create form for ISMS base assets (application, system, process, data, location, connection).
      SimpleAssetDisplayRow.tsx  # display ISMS base assets; optional expand, edit actions
      SimpleAssetEditorRow.tsx  # editor for ISMS base assets; save, delete, cancel actions
    _scaffold/
      AssetPageScaffold.tsx  # Generic scaffold asset pages; list, create, edit, expand functionality
      types.ts  # Types for AssetPageScaffold props
    applications/
      page.tsx  # display, manage Application assets
    connections/
      page.tsx  # display, manage Connection assets
    data/
      page.tsx  # display, manage Data assets
    locations/
      page.tsx  # display, manage Location assets
    processes/
      page.tsx  # display, manage Process assets
    systems/
      page.tsx  # display, manage system assets
  auth/
    [...path]/
      route.ts  # Auth proxy to internal GoTrue service
  login/
    _client-auth-buttons.tsx  # Client-side authentication buttons for login/logout
    page.tsx  # Login, Signup
  ownership/
    page.tsx  # display, manage Ownership/Teams
  people/
    page.tsx  # display, manage People
components/
  ui/
    button.tsx
    dropdown-menu.tsx  # Dropdown menu, Radix UI and Tailwind CSS
lib/
  auth.ts  # Initialize GoTrueClient for authentication
  fetch-timeout.ts  # fetchWithTimeout(): hard 15s default for all network calls
  logDebug.ts  # logDebug() conditional on IsDebug from backend config
  utils.ts  # cn() utility for merging Tailwind CSS class names
  backend/
    config.ts
    postgrest.ts
  browser/
    api-app.ts  # Browser PostgREST helper for the `app` schema
    api-isms.ts  # Browser PostgREST helper for the `isms` schema
    config.ts  # getApiUrl() and getAuthUrl()
    isms/
      application-systems.ts  # api-isms '/application_systems' GET +embedding POST/DELETE FK writes.
      applications.ts  # api-isms '/applications' CRUD, owner embedding
      assetTypes.ts  # Shared asset type definitions for 'people', 'ownership', 'application', 'system', 'process', 'data', 'location', and 'connection' assets.
      connection-locations.ts  # api-isms '/location_connections' GET +embedding POST/DELETE FK writes.
      connections.ts  # api-isms '/connections' CRUD, owner embedding
      dataAssets.ts  # api-isms '/data' CRUD, owner embedding
      location-connections.ts  # api-isms '/location_connections' GET +embedding POST/DELETE FK writes.
      locations.ts  # api-isms '/locations' CRUD, owner embedding
      ownership.ts  # api-isms '/ownership' CRUD, owner embedding
      process-applications.ts  # api-isms '/process_applications' GET +embedding POST/DELETE FK writes.
      processes.ts  # api-isms '/processes' CRUD, owner embedding
      system-data.ts  # api-isms '/system_data' GET +embedding POST/DELETE FK writes.
      systems.ts  # api-isms '/systems' CRUD, owner embedding
``` 
 
```ts 
// app/_hooks/queryKeys.ts 
export const queryKeys = {
  // Generic assets
  assets: {
    all: (kind: AssetKind) => ["assets", kind, "all"] as const,
    byId: (kind: AssetKind, id: string) => ["assets", kind, "byId", id] as const,
  },

  // Generic parent→child linking lists
  links: {
    list: (parentKind: AssetKind, parentId: string, childKind: AssetKind) =>
      ["links", parentKind, parentId, childKind] as const,

    // minimal predicate to hit all lists for a given child kind
    isForChild: (key: QueryKey, childKind: AssetKind) =>
      Array.isArray(key) && key[0] === "links" && key[3] === childKind,
  },
};
```

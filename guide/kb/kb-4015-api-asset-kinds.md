--- 
title: API Overview (PostgREST & RPC) 
tags: [api, postgrest, rpc, routes, security, rls] 
related: [kb-3010-schema-overview, kb-5010-nextjs-app-overview, kb-4010-api-overview] 
--- 

# Asset Kind References to Synchronize
- kb-4015-api-asset-kinds.md
- 010_isms.sql > isms.map_nodes > asset_kind
- assetTypes.ts > AssetKind

# Asset Kinds 
In this Order:
- "person"
- "ownership"
- "process"
- "application"
- "system"
- "location"
- "data"
- "connection"
- "data_category"
- "map"


# Map Kind References to Synchronize
- assetTypes.ts > MapKind
- 010_isms.sql > isms.maps > map_kind

# Map Kinds
- "organization"   // map of all people, teams (think org chart, Roles)
- "process"        // map of processes, applications (suppliers? customers? SIPOCs?)
- "infrastructure" // map of all systems, locations, connections
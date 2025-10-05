//app/_hooks/queryKeys.ts
//Description: Centralized query keys for React Query
"use client";

import { AssetKind } from "@/lib/browser/isms/assetTypes";
import { QueryKey } from "@tanstack/react-query";

// on change, update kb-5012-nextjs-app-isms-pages.md!
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

  maps: {
    all: ["maps", "all"],
    allMapIcons: ["mapIcons", "all"],
    allMapNodes: ["mapNodes", "all"],
    mapNodes: (mapId: string) => ["mapNodes", mapId, "all"],
    isMapNodeKey: (key: QueryKey) =>
      Array.isArray(key) && key[0] === "mapNodes",
  }
};

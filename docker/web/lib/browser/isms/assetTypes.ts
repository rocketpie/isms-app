//lib/browser/isms/assetTypes.ts
//Description: Shared asset type definitions for 'people', 'ownership', 'application', 'system', 'process', 'data', 'location', and 'connection' assets.
"use client";

// Attention: keep in sync with kb-4015-api-asset-kinds.md
export type AssetKind =
  | "person"
  | "ownership"
  | "process"
  | "application"
  | "system"
  | "location"
  | "data"
  | "connection"
  | "data_category"
  | "map";

/**
 * VIEW type (what the UI renders after a read with embedding)
 * - X allows asset-specific extras
*/
export type BaseAssetView<X extends object = {}> = {
  id: string;
  name: string;
  description: string | null;
} & X;

// owner is already expanded as OwnershipView|null
export type OwnedAssetView<X extends object = {}> = BaseAssetView<X & {
  owner: OwnershipView | null;
}>

/**
 * ROW type (what you send on writes)
 * - X allows asset-specific extras
*/
export type BaseAssetRow<X extends object = {}> = {
  id?: string;
  name: string;
  description: string | null;
  owner_id: string | null;
} & X;

// owner_id is FK, description remains nullable
export type OwnedAssetRow<X extends object = {}> = BaseAssetRow<X & {
  owner_id: string | null;
}>

/**
 * Helpers to create precise aliases per domain with zero duplication.
 */
export type PersonView = BaseAssetView;
export type PersonRow = BaseAssetRow;

export type OwnershipView = {
  id: string;
  name: string;
  primary: PersonView | null;
  deputy: PersonView | null;
};

export type OwnershipRow = {
  id?: string;
  name: string;
  primary_person_id: string | null;
  deputy_person_id: string | null;
};

export type DataCategoryView = BaseAssetView
export type DataCategoryRow = BaseAssetRow

// Owned assets
export type ProcessView = OwnedAssetView;
export type ProcessRow = OwnedAssetRow;

export type ApplicationView = OwnedAssetView;
export type ApplicationRow = OwnedAssetRow;

export type SystemView = OwnedAssetView<{
  location: LocationView | null
}>;
export type SystemRow = OwnedAssetRow<{
  location_id: string | null
}>;

export type DataAssetView = OwnedAssetView<{
  category: DataCategoryView | null
}>;
export type DataAssetRow = OwnedAssetRow<{
  category_id: string | null
}>;

export type LocationView = OwnedAssetView;
export type LocationRow = OwnedAssetRow;

export type ConnectionView = OwnedAssetView;
export type ConnectionRow = OwnedAssetRow;

export type MapKind =
  | "organization" // map of all people, teams (think org chart, Roles)
  | "process" // map of processes, applications (suppliers? customers? SIPOCs?)
  | "infrastructure" // map of all systems, locations, connections

export type MapView = OwnedAssetView<{
  map_kind: MapKind
}>;
export type MapRow = OwnedAssetRow<{
  map_kind: MapKind
}>;
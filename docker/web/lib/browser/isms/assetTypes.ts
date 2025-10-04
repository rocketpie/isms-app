//lib/browser/isms/assetTypes.ts
//Description: Shared asset type definitions for 'people', 'ownership', 'application', 'system', 'process', 'data', 'location', and 'connection' assets.
"use client";

import { OwnershipView } from "./ownership";

export type AssetKind =
  | "people"
  | "ownership"
  | "application"
  | "system"
  | "process"
  | "data"
  | "location"
  | "connection";

/**
 * VIEW type (what the UI renders after a read with embedding)
 * - owner is already expanded as OwnershipView|null
 * - X allows per-asset extras (rare, but future-proof)
 */
export type BaseAssetView<
  X extends object = {},
  O extends OwnershipView | null = OwnershipView | null,
> = {
  id: string;
  name: string;
  description: string | null;
  owner: O;
} & X;

/**
 * ROW type (what you send on writes)
 * - owner_id is FK, description remains nullable
 * - X allows per-asset extras on the row
 */
export type BaseAssetRow<X extends object = {}> = {
  id?: string;
  name: string;
  description: string | null;
  owner_id: string | null;
} & X;

/**
 * Helpers to create precise aliases per domain with zero duplication.
 */
export type ApplicationView = BaseAssetView;
export type ApplicationRow = BaseAssetRow;

export type SystemView = BaseAssetView<{
  location: LocationView | null
}>;
export type SystemRow = BaseAssetRow<{
  location_id: string | null
}>;

export type ProcessView = BaseAssetView;
export type ProcessRow = BaseAssetRow;

export type DataAssetView = BaseAssetView;
export type DataAssetRow = BaseAssetRow;

export type LocationView = BaseAssetView;
export type LocationRow = BaseAssetRow;

export type ConnectionView = BaseAssetView;
export type ConnectionRow = BaseAssetRow;

import { BaseAssetView } from "@/lib/browser/isms/assetTypes";
import React from "react";

export type AssetHooks<TAsset extends BaseAssetView> = {
  list: { data?: TAsset[]; isLoading: boolean; error: unknown };
  create: { mutateAsync: (newItem: TAsset) => Promise<unknown>; isPending: boolean };
  update: { mutate: (patch: TAsset) => void; isPending: boolean };
  remove: { mutate: (id: string) => void; isPending: boolean };
};

export type AssetRowRenderers<TAsset extends BaseAssetView> = {
  assetTypeName: string; // e.g., "Process"
  DisplayRow: React.ComponentType<{
    value: TAsset;
    expanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
  }>
  ExpandedView?: (asset: TAsset) => React.ReactNode // e.g., <LinkedApplicationsSection processId=... />
  EditorRow: React.ComponentType<{
    value: TAsset;
    owners: { id: string; name: string }[];
    disabled?: boolean;
    onChange: (draft: TAsset) => void;
    onSave: () => void;
    onDelete: () => void;
    onCancel: () => void;
  }>
  CreateForm: React.ComponentType<{
    title: string;
    owners: { id: string; name: string }[];
    onSubmit: (v: Partial<TAsset>) => Promise<unknown>;
    className?: string;
  }>
};

//app/assets/_components/OwnedAssetDisplayRow.tsx
//Description: display ISMS assets with owner; optional expand, edit actions
"use client";

import { OwnedAssetView } from "@/lib/browser/isms/assetTypes";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";

export default function OwnedAssetDisplayRow(props: {
  value: OwnedAssetView;
  extraInfo?: { name: string, value: string | null };
  expanded?: boolean;
  onEdit?: () => void;
  onToggle?: () => void;
}) {
  return (
    <div className="grid gap-1 grid-cols-1 md:grid-cols-[1fr,2fr,1fr,1fr,auto] md:items-center">
      <button
        type="button"
        className={`flex items-center gap-2 text-base text-neutral-700 ${props.onToggle ? "hover:text-black" : "cursor-default"}`}
        onClick={props.onToggle}
        disabled={!props.onToggle}
        aria-expanded={!!props.expanded}
      >
        {!props.onToggle ? (
          <span className="inline-block w-4 h-4" />
        ) : props.expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {props.value?.name}
      </button>

      <div className="text-sm text-neutral-700">
        {props.value?.description ? (
          <span className="text-neutral-600">{props.value?.description}</span>
        ) : (
          <span className="text-neutral-400">No description</span>
        )}
      </div>

      <div className="text-sm text-neutral-700">
        {props.extraInfo ? (
          props.extraInfo.value ? (
            <span className="text-neutral-600">{props.extraInfo.value}</span>
          ) : (
            <span className="text-neutral-400">No {props.extraInfo.name}</span>
          )
        ) : (<span />)
        }
      </div>

      <div className="text-sm text-neutral-700">
        Owner:{" "}
        <span className="text-neutral-600">{props.value?.owner?.name}</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-xl px-3 py-2 border bg-white"
          onClick={props.onEdit}
        >
          <Pencil className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

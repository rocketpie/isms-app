//app/assets/_components/SimpleAssetEditorRow.tsx
//Description: editor for ISMS base assets; save, delete, cancel actions
"use client";

import { BaseAssetView } from "@/lib/browser/isms/assetTypes";
import { OwnershipView } from "@/lib/browser/isms/ownership";
import React from "react";

export default function SimpleAssetEditorRow<T extends BaseAssetView>(props: {
  value: T;
  extraEditor?: React.ReactNode;
  owners: OwnershipView[];
  disabled?: boolean;
  onChange: (draft: T) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (props.disabled) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (props.value.name.trim().length > 0) props.onSave();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      props.onCancel();
    }
  }

  return (
    <div
      className="grid gap-2 md:grid-cols-[1fr,2fr,1fr,1fr,auto]"
      onKeyDown={handleKeyDown}
      role="group"
      aria-disabled={props.disabled}
    >
      <label className="sr-only" htmlFor={`asset-name-${props.value.id}`}>
        Name
      </label>
      <input
        id={`asset-name-${props.value.id}`}
        className="border rounded-lg px-3 py-2"
        placeholder="Name"
        value={props.value.name}
        onChange={(event) =>
          props.onChange({ ...props.value, name: event.target.value })
        }
        disabled={props.disabled}
        required
      />

      <label className="sr-only" htmlFor={`asset-desc-${props.value.id}`}>
        Description
      </label>
      <input
        id={`asset-desc-${props.value.id}`}
        className="border rounded-lg px-3 py-2"
        placeholder="description"
        value={props.value.description ?? ""}
        onChange={(event) =>
          props.onChange({ ...props.value, description: event.target.value })
        }
        disabled={props.disabled}
      />


      <div className="flex flex-col">
        {props.extraEditor ?? ""}
      </div>

      <div className="flex flex-col">
        <label
          className="text-sm text-neutral-700 mb-1"
          htmlFor={`asset-owner-${props.value.id}`}
        >
          Owner
        </label>
        <select
          id={`asset-owner-${props.value.id}`}
          className="border rounded-lg px-3 py-2"
          value={props.value.owner?.id ?? ""}
          onChange={(event) =>
            props.onChange({
              ...props.value,
              owner:
                props.owners.find((o) => o.id === event.target.value) ?? null,
            })
          }
          disabled={props.disabled}
        >
          <option value="">No owner</option>
          {props.owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
          onClick={props.onSave}
          disabled={props.disabled || props.value.name.trim().length === 0}
        >
          Save
        </button>
        <button
          type="button"
          className="rounded-xl px-3 py-2 border bg-white text-red-600 disabled:opacity-60"
          onClick={props.onDelete}
          disabled={props.disabled}
        >
          Delete
        </button>
        <button
          type="button"
          className="rounded-xl px-3 py-2 border bg-white"
          onClick={props.onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

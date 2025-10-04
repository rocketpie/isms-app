//app/assets/systems/page.tsx
//Description: display, manage system assets
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import SimpleAssetDisplayRow from "../_components/SimpleAssetDisplayRow";
import SimpleAssetEditorRow from "../_components/SimpleAssetEditorRow";
import SimpleAssetCreateForm from "../_components/SimpleAssetCreateForm";
import type { DataAssetView, LocationView, SystemView } from "@/lib/browser/isms/assetTypes";
import { useLocations, useSystems } from "@/app/_hooks/useAssets";
import LinkedAssetSection from "../_components/LinkedAssetsSection";
import { useSystemData } from "@/app/_hooks/useAssetLinks";
import { OwnershipView } from "@/lib/browser/isms/ownership";
import { useMemo } from "react";


function SystemDisplayRow(props: {
  value: SystemView;
  expanded?: boolean;
  onEdit?: () => void;
  onToggle?: () => void;
}) {
  const { value, expanded, onEdit, onToggle } = props;
  return (
    <SimpleAssetDisplayRow
      value={value}
      expanded={expanded}
      onEdit={onEdit}
      onToggle={onToggle}
      extraInfo={{ name: "Location", value: value.location?.name ?? null }}
    />
  );
}

function SystemEditorRow(props: {
  value: SystemView;
  owners: OwnershipView[];
  locations: LocationView[];
  disabled?: boolean;
  onChange: (draft: SystemView) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { list } = useLocations();
  const locations = useMemo(() => list.data ?? [], [list.data]);

  return (
    <SimpleAssetEditorRow<SystemView>
      value={props.value}
      owners={props.owners}
      disabled={props.disabled}
      onChange={props.onChange}
      onSave={props.onSave}
      onDelete={props.onDelete}
      onCancel={props.onCancel}
      extraEditor={
        <div>
          <label
            className="text-sm text-neutral-700 mb-1"
            htmlFor={`location-${props.value.id}`}
          >
            Location
          </label>
          <select
            id={`location-${props.value.id}`}
            className="border rounded-lg px-3 py-2"
            value={props.value.location?.id ?? ""}
            onChange={(event) =>
              props.onChange({
                ...props.value,
                location: locations.find((l) => l.id === event.target.value) ?? null,
              })
            }
            disabled={props.disabled}
          >
            <option value="">No location</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      }
    />
  );
}


export default function SystemsPage() {
  const systems = useSystems();

  return (
    <AssetPageScaffold<SystemView>
      hooks={{ ...systems }}
      rows={{
        assetTypeName: "System",
        DisplayRow: SystemDisplayRow as any,
        EditorRow: SystemEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        ExpandedView: (system) => (
          <LinkedAssetSection<DataAssetView>
            className="col-span-full mt-3"
            parentId={system.id}
            itemTypeName="Data"
            linkHookFactory={useSystemData}
          />
        ),
      }}
    />
  );
}

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";

import LoadingLine from "./LoadingLine";
import ErrorBanner from "./ErrorBanner";
import { BaseAssetView } from "@/lib/browser/isms/assetTypes";
import SimpleAssetEditorRow from "./SimpleAssetEditorRow";
import SimpleAssetDisplayRow from "./SimpleAssetDisplayRow";
import SimpleAssetCreateForm from "./SimpleAssetCreateForm";
import { listOwnerships } from "@/lib/browser/isms/ownership";
import { queryKeys } from "@/app/_hooks/queryKeys";
import { AssetHooks } from "../_scaffold/types";

export type LinkHooks<TAsset extends BaseAssetView> = {
  listAll: { data?: TAsset[]; isLoading: boolean; error: Error | null };
  listLinked: { data?: TAsset[]; isLoading: boolean; error: Error | null };
  link: { mutate: (itemId: string) => void; isPending: boolean };
  unlink: { mutate: (itemId: string) => void; isPending: boolean };
  // createAndLink: { mutateAsync: (newItem: TAsset) => Promise<unknown>; isPending: boolean };
};

export default function LinkedAssetSection<
  TChild extends BaseAssetView,
>(props: {
  className?: string;
  parentId: string;
  itemTypeName: string;
  linkHooks: LinkHooks<TChild>;
  assetHooks: AssetHooks<TChild>;
}) {
  // local UI state
  const [search, setSearch] = useState("");
  const [pickerValue, setPickerValue] = useState("");
  const [editing, setEditing] = useState<Record<string, TChild>>({});

  const { listLinked, listAll, link, unlink } = props.linkHooks;

  const ownersQuery = useQuery({
    queryKey: queryKeys.allOwnership,
    queryFn: listOwnerships,
  });
  const owners = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data]);
  const linkedItems = useMemo(
    () => props.linkHooks.listLinked.data ?? [],
    [props.linkHooks.listLinked.data],
  );
  const allItems = useMemo(
    () => props.linkHooks.listAll.data ?? [],
    [props.linkHooks.listAll.data],
  );

  // compute selectable items
  const linkedIds = new Set((linkedItems || []).map((item) => item.id));
  const itemsAvailableToLink = (allItems || [])
    .filter((item) => !linkedIds.has(item.id))
    .filter((item) =>
      search ? item.name.toLowerCase().includes(search.toLowerCase()) : true,
    );

  return (
    <div className={props.className}>
      <h4 className="font-medium mb-2">linked {props.itemTypeName}</h4>

      {(listLinked.isLoading || listAll.isLoading) && (
        <LoadingLine label="Loading…" />
      )}
      {(listLinked.error || listAll.error) && (
        <ErrorBanner
          message={
            ((listLinked.error || listAll.error) as Error)?.message || "Error"
          }
        />
      )}

      {/* list of linked items*/}
      <ul className="grid gap-2">
        {linkedItems.map((item) => {
          if (!item) return null;
          const isEditing = editing[item.id] !== undefined;
          const value = isEditing ? editing[item.id] : item;

          return (
            <li key={item.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  {isEditing ? (
                    <SimpleAssetEditorRow<TChild>
                      value={value}
                      owners={owners}
                      disabled={
                        props.assetHooks.update.isPending ||
                        props.assetHooks.remove.isPending
                      }
                      onChange={(draft) =>
                        setEditing((prev) => ({ ...prev, [item.id]: draft }))
                      }
                      onSave={() => {
                        props.assetHooks.update.mutate(value);
                        setEditing(({ [item.id]: _omit, ...rest }) => rest);
                      }}
                      onDelete={() => {
                        const ok = confirm(
                          `Delete this ${props.itemTypeName}?\n\nNote: junctions may cascade.`,
                        );
                        if (ok) props.assetHooks.remove.mutate(item.id);
                      }}
                      onCancel={() =>
                        setEditing(({ [item.id]: _omit, ...rest }) => rest)
                      }
                    />
                  ) : (
                    <SimpleAssetDisplayRow
                      value={item}
                      onEdit={() =>
                        setEditing((prev) => ({ ...prev, [item.id]: item }))
                      }
                    />
                  )}
                </div>

                <button
                  className="rounded-lg px-3 py-1 border text-red-600 disabled:opacity-60"
                  disabled={link.isPending || unlink.isPending}
                  onClick={() => unlink.mutate(item.id)}
                  title="Remove link"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
        {linkedItems.length === 0 && (
          <li className="text-sm text-neutral-500">
            No {`${props.itemTypeName}`} linked.
          </li>
        )}
      </ul>

      {/* add existing */}
      <div className="mt-3 grid gap-2 md:grid-cols-5">
        <input
          className="border rounded-lg px-3 py-2 md:col-span-2"
          placeholder={`Search ${props.itemTypeName}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 md:col-span-2"
          value={pickerValue}
          onChange={(e) => setPickerValue(e.target.value)}
          disabled={listAll.isLoading}
        >
          <option value="">{`Add existing ${props.itemTypeName}…`}</option>
          {itemsAvailableToLink.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-lg px-3 py-2 border bg-black text-white disabled:opacity-60"
          disabled={!pickerValue || link.isPending || unlink.isPending}
          onClick={() => link.mutate(pickerValue as string)}
        >
          Link
        </button>
      </div>

      {/* create new + auto-link */}
      <details className="group mt-2">
        <summary className="flex items-center gap-2 text-sm text-neutral-700">
          <ChevronRight className="h-4 w-4 group-open:hidden" />
          <ChevronDown className="h-4 w-4 hidden group-open:block" />
          <span>link a new item</span>
        </summary>
        <SimpleAssetCreateForm<TChild>
          owners={owners}
          className="mt-4"
          onSubmit={(newItem) =>
            props.assetHooks.create.mutateAsync(newItem).then((newId) => {
              link.mutate(newId as string);
            })
          }
        />
      </details>
    </div>
  );
}

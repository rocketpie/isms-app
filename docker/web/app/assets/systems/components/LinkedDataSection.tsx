// app/assets/systems/components/LinkedDataSection.tsx
'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { queryKeys } from '@/app/_hooks/queryKeys';
import { listOwnerships } from '@/lib/browser/isms/ownership';

import type { DataAssetView } from '@/lib/browser/isms/assetTypes';


import SimpleAssetDisplayRow from '../../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../../_components/SimpleAssetCreateForm';
import { createData, listData } from '@/lib/browser/isms/dataAssets';
import { useData } from '@/app/_hooks/useData';
import { linkData, listLinkedData, SystemDataView, unlinkData } from '@/lib/browser/isms/system-data';

export function LinkedDataSection({ systemId }: { systemId: string }) {
    const queryClient = useQueryClient();
    const { update, remove } = useData(); // reuse data-asset mutations for inline edit / optional delete

    // Linked to this system
    const linkedQuery = useQuery({
        queryKey: queryKeys.systemData(systemId),
        queryFn: () => listLinkedData(systemId),
    });

    // All data assets (exclude already-linked)
    const allDataQuery = useQuery({
        queryKey: queryKeys.allData,
        queryFn: listData,
        staleTime: 30_000,
    });

    // Owners for editor + create form
    const ownersQuery = useQuery({
        queryKey: queryKeys.allOwnership,
        queryFn: listOwnerships,
    });

    // Optimistic link
    const linkMutation = useMutation({
        mutationFn: ({ dataAssetId }: { dataAssetId: string }) => linkData(systemId, dataAssetId),
        onMutate: async ({ dataAssetId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.systemData(systemId) });

            const previous =
                queryClient.getQueryData<SystemDataView[]>(queryKeys.systemData(systemId)) || [];

            const dataAsset = (allDataQuery.data || []).find((d) => d.id === dataAssetId);
            if (dataAsset) {
                queryClient.setQueryData<SystemDataView[]>(
                    queryKeys.systemData(systemId),
                    [...previous, { system_id: systemId, data_id: dataAsset.id, data: dataAsset }],
                );
            }
            return { previous };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(queryKeys.systemData(systemId), ctx.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.systemData(systemId) });
        },
    });

    // Optimistic unlink
    const unlinkMutation = useMutation({
        mutationFn: ({ dataAssetId }: { dataAssetId: string }) => unlinkData(systemId, dataAssetId),
        onMutate: async ({ dataAssetId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.systemData(systemId) });

            const previous =
                queryClient.getQueryData<SystemDataView[]>(queryKeys.systemData(systemId)) || [];

            queryClient.setQueryData<SystemDataView[]>(
                queryKeys.systemData(systemId),
                previous.filter((x) => x.data_id !== dataAssetId),
            );

            return { previous };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(queryKeys.systemData(systemId), ctx.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.systemData(systemId) });
        },
    });

    // Local UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [pickerValue, setPickerValue] = useState<string>('');
    const [editing, setEditing] = useState<Record<string, DataAssetView>>({}); // id -> draft

    // Compute available data assets to link
    const linkedIds = new Set((linkedQuery.data || []).map((x) => x.data_id));
    const available = (allDataQuery.data || [])
        .filter((item) => !linkedIds.has(item.id)) // exclude already-linked
        .filter((item) =>
            searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
        ); // apply search filter

    return (
        <div className="mt-3 rounded-xl border bg-white p-3">
            <h4 className="font-medium mb-2">Data assets</h4>

            {/* Linked list */}
            {linkedQuery.isLoading && <p>Loading linked…</p>}
            {linkedQuery.error && (
                <p className="text-sm text-red-600">{(linkedQuery.error as Error).message}</p>
            )}

            <ul className="grid gap-2">
                {(linkedQuery.data || []).map((link) => {
                    const item = link.data;
                    if (!item) return null; // defensive

                    const isEditing = editing[item.id] !== undefined;
                    const value = isEditing ? editing[item.id] : item;

                    return (
                        <li key={link.data_id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    {isEditing ? (
                                        <SimpleAssetEditorRow
                                            value={value}
                                            owners={ownersQuery.data || []}
                                            disabled={update.isPending || remove.isPending}
                                            onChange={(draft) => setEditing((prev) => ({ ...prev, [item.id]: draft }))}
                                            onSave={() => {
                                                update.mutate({ id: item.id, patch: value });
                                                setEditing(({ [item.id]: _omit, ...rest }) => rest);
                                            }}
                                            onDelete={() => {
                                                const ok = confirm(
                                                    'Delete this data asset?\n\nNote: related junctions may cascade delete depending on FK policy.',
                                                );
                                                if (ok) remove.mutate(item.id);
                                            }}
                                            onCancel={() => setEditing(({ [item.id]: _omit, ...rest }) => rest)}
                                        />
                                    ) : (
                                        <SimpleAssetDisplayRow
                                            value={item}
                                            expanded={false}
                                            onEdit={() => setEditing((prev) => ({ ...prev, [item.id]: item }))}
                                        />
                                    )}
                                </div>

                                <button
                                    className="rounded-lg px-3 py-1 border text-red-600 disabled:opacity-60"
                                    disabled={unlinkMutation.isPending}
                                    onClick={() => unlinkMutation.mutate({ dataAssetId: link.data_id })}
                                    title="Remove link"
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    );
                })}
                {(linkedQuery.data || []).length === 0 && (
                    <li className="text-sm text-neutral-500">No linked data assets.</li>
                )}
            </ul>

            {/* Add existing */}
            <div className="mt-3 grid gap-2 md:grid-cols-5">
                <input
                    className="border rounded-lg px-3 py-2 md:col-span-2"
                    placeholder="Search data assets…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                    className="border rounded-lg px-3 py-2 md:col-span-2"
                    value={pickerValue}
                    onChange={(e) => setPickerValue(e.target.value)}
                    disabled={allDataQuery.isLoading}
                >
                    <option value="">Add existing…</option>
                    {available.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
                <button
                    className="rounded-lg px-3 py-2 border bg-black text-white disabled:opacity-60"
                    disabled={!pickerValue || linkMutation.isPending}
                    onClick={() => linkMutation.mutate({ dataAssetId: pickerValue })}
                >
                    Link data asset
                </button>
            </div>

            {/* Create new + auto-link (reusing the shared form) */}
            <details className="group mt-2">
                <summary className="flex items-center gap-2 text-sm text-neutral-700">
                    <ChevronRight className="h-4 w-4 group-open:hidden" />
                    <ChevronDown className="h-4 w-4 hidden group-open:block" />
                    <span>link a new data asset</span>
                </summary>
                <SimpleAssetCreateForm
                    owners={ownersQuery.data || []}
                    className="mt-4"
                    onSubmit={(newDataAsset) =>
                        createData({ ...newDataAsset })
                            .then((created) => {
                                if (created[0].id) {
                                    linkData(systemId, created[0].id)
                                } else {
                                    console.error(`3dfde342: ${JSON.stringify(created)}`);
                                }
                            })
                            .finally(() => {
                                queryClient.invalidateQueries({ queryKey: queryKeys.systemData(systemId) });
                                queryClient.invalidateQueries({ queryKey: queryKeys.allData });
                            })
                    }
                />
            </details>
        </div>
    );
}

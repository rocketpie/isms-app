'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { queryKeys } from '@/app/_hooks/queryKeys';
import { listOwnerships } from '@/lib/browser/isms/ownership';

import { useConnections } from '@/app/_hooks/useConnections';
import { listConnections, createConnection } from '@/lib/browser/isms/connections';
import type { ConnectionView } from '@/lib/browser/isms/assetTypes';

import {
    listLinkedConnections,
    linkConnection,
    unlinkConnection,
} from '@/lib/browser/isms/location-connections';
import type { LocationConnectionView } from '@/lib/browser/isms/location-connections';

import SimpleAssetDisplayRow from '../../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../../_components/SimpleAssetCreateForm';

export function LinkedConnectionsSection({ locationId }: { locationId: string }) {
    const queryClient = useQueryClient();
    const { update, remove } = useConnections(); // reuse mutations for inline edit / optional delete

    // Linked to this location
    const linkedQuery = useQuery({
        queryKey: queryKeys.locationConnections(locationId),
        queryFn: () => listLinkedConnections(locationId),
    });

    // All connections (exclude already-linked)
    const allConnectionsQuery = useQuery({
        queryKey: queryKeys.allConnections,
        queryFn: listConnections,
        staleTime: 30_000,
    });

    // Owners for editor + create form
    const ownersQuery = useQuery({
        queryKey: queryKeys.allOwnership,
        queryFn: listOwnerships,
    });

    // Optimistic link
    const linkMutation = useMutation({
        mutationFn: ({ connectionId }: { connectionId: string }) => linkConnection(locationId, connectionId),
        onMutate: async ({ connectionId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.locationConnections(locationId) });

            const previous =
                queryClient.getQueryData<LocationConnectionView[]>(queryKeys.locationConnections(locationId)) || [];

            const conn = (allConnectionsQuery.data || []).find((c) => c.id === connectionId);
            if (conn) {
                queryClient.setQueryData<LocationConnectionView[]>(
                    queryKeys.locationConnections(locationId),
                    [...previous, { location_id: locationId, connection_id: conn.id, connection: conn }]
                );
            }
            return { previous };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(queryKeys.locationConnections(locationId), ctx.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.locationConnections(locationId) });
        },
    });

    // Optimistic unlink
    const unlinkMutation = useMutation({
        mutationFn: ({ connectionId }: { connectionId: string }) => unlinkConnection(locationId, connectionId),
        onMutate: async ({ connectionId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.locationConnections(locationId) });

            const previous =
                queryClient.getQueryData<LocationConnectionView[]>(queryKeys.locationConnections(locationId)) || [];

            queryClient.setQueryData<LocationConnectionView[]>(
                queryKeys.locationConnections(locationId),
                previous.filter((x) => x.connection_id !== connectionId)
            );
            return { previous };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(queryKeys.locationConnections(locationId), ctx.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.locationConnections(locationId) });
        },
    });

    // Local UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [pickerValue, setPickerValue] = useState<string>('');
    const [editing, setEditing] = useState<Record<string, ConnectionView>>({}); // id -> draft

    // Compute available connections to link
    const linkedIds = new Set((linkedQuery.data || []).map((x) => x.connection_id));
    const available = (allConnectionsQuery.data || [])
        .filter((item) => !linkedIds.has(item.id))
        .filter((item) => (searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true));

    return (
        <div className="mt-3 rounded-xl border bg-white p-3">
            <h4 className="font-medium mb-2">Connections</h4>

            {/* Linked list */}
            {linkedQuery.isLoading && <p>Loading linked…</p>}
            {linkedQuery.error && <p className="text-sm text-red-600">{(linkedQuery.error as Error).message}</p>}

            <ul className="grid gap-2">
                {(linkedQuery.data || []).map((link) => {
                    const item = link.connection;
                    if (!item) return null;

                    const isEditing = editing[item.id] !== undefined;
                    const value = isEditing ? editing[item.id] : item;

                    return (
                        <li key={link.connection_id} className="border rounded-lg p-3">
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
                                                    'Delete this connection?\n\nNote: related junctions may cascade delete depending on FK policy.'
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
                                    onClick={() => unlinkMutation.mutate({ connectionId: link.connection_id })}
                                    title="Remove link"
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    );
                })}

                {(linkedQuery.data || []).length === 0 && (
                    <li className="text-sm text-neutral-500">No linked connections.</li>
                )}
            </ul>

            {/* Add existing */}
            <div className="mt-3 grid gap-2 md:grid-cols-5">
                <input
                    className="border rounded-lg px-3 py-2 md:col-span-2"
                    placeholder="Search connections…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                    className="border rounded-lg px-3 py-2 md:col-span-2"
                    value={pickerValue}
                    onChange={(e) => setPickerValue(e.target.value)}
                    disabled={allConnectionsQuery.isLoading}
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
                    onClick={() => linkMutation.mutate({ connectionId: pickerValue })}
                >
                    Link connection
                </button>
            </div>

            {/* Create new + auto-link */}
            <details className="group mt-2">
                <summary className="flex items-center gap-2 text-sm text-neutral-700">
                    <ChevronRight className="h-4 w-4 group-open:hidden" />
                    <ChevronDown className="h-4 w-4 hidden group-open:block" />
                    <span>link a new connection</span>
                </summary>

                <SimpleAssetCreateForm
                    owners={ownersQuery.data || []}
                    className="mt-4"
                    onSubmit={(newConnection) =>
                        createConnection({ ...newConnection })
                            .then((created) => {
                                if (created[0].id) {
                                    linkConnection(locationId, created[0].id)
                                } else {
                                    console.error(`9cc3ad89: ${JSON.stringify(created)}`);
                                }
                            })
                            .finally(() => {
                                queryClient.invalidateQueries({ queryKey: queryKeys.locationConnections(locationId) });
                                queryClient.invalidateQueries({ queryKey: queryKeys.allConnections });
                            })
                    }
                />
            </details>
        </div>
    );
}

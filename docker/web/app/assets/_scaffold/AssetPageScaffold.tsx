// app/assets/_scaffold/AssetPageScaffold.tsx
'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/_hooks/queryKeys';
import { listOwnerships } from '@/lib/browser/isms/ownership';

import type { AssetHooks, AssetRowRenderers } from './types';
import { BaseAssetView } from '@/lib/browser/isms/assetTypes';
import EmptyState from '../_components/EmptyState';
import ErrorBanner from '../_components/ErrorBanner';
import LoadingLine from '../_components/LoadingLine';

export default function AssetPageScaffold<TAsset extends BaseAssetView>({
    hooks,
    rows,
}: {
    hooks: AssetHooks<TAsset>;
    rows: AssetRowRenderers<TAsset>;
}) {
    const ownersQuery = useQuery({ queryKey: queryKeys.allOwnership, queryFn: listOwnerships });

    const items = useMemo(() => hooks.list.data ?? [], [hooks.list.data]);
    const owners = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data]);

    const [editing, setEditing] = useState<Record<string, TAsset>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const isLoading = hooks.list.isLoading || ownersQuery.isLoading;
    const error = (hooks.list.error as Error) || (ownersQuery.error as Error);

    return (
        <div className="grid gap-6">
            <div className="grid gap-2">
                {isLoading && <LoadingLine label={`Loading ${rows.assetTypeName}...`} />}
                {error && <ErrorBanner message={error.message} />}

                {items.length === 0 && !isLoading && <EmptyState label={`No ${rows.assetTypeName} yet.`} />}

                <ul className="grid gap-2">
                    {items.map(item => {
                        const isEditing = editing[item.id] !== undefined;
                        const value = isEditing ? editing[item.id] : item;

                        return (
                            <li key={item.id} className="bg-white border rounded-xl p-3">
                                {isEditing ? (
                                    <rows.EditorRow
                                        value={value}
                                        owners={owners}
                                        disabled={hooks.update.isPending || hooks.remove.isPending}
                                        onChange={draft => setEditing(prev => ({ ...prev, [item.id]: draft }))}
                                        onSave={() => {
                                            hooks.update.mutate(value);
                                            setEditing(({ [item.id]: _omit, ...rest }) => rest);
                                        }}
                                        onDelete={() => {
                                            if (confirm(`Delete this ${rows.assetTypeName}?\n\nLinked junctions may cascade delete.`)) {
                                                hooks.remove.mutate(item.id);
                                            }
                                        }}
                                        onCancel={() => setEditing(({ [item.id]: _omit, ...rest }) => rest)}
                                    />
                                ) : (
                                    <rows.DisplayRow
                                        value={item}
                                        expanded={!!expanded[item.id]}
                                        onToggle={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                        onEdit={() => setEditing(prev => ({ ...prev, [item.id]: item }))}
                                    />
                                )}

                                {!isEditing && expanded[item.id] && rows.ExpandedView?.(item)}
                            </li>
                        );
                    })}
                </ul>
            </div>

            <rows.CreateForm
                title={rows.assetTypeName}
                owners={owners}
                onSubmit={(v: any) => hooks.create.mutateAsync(v)}
                className="bg-white border rounded-2xl p-4"
            />
        </div>
    );
}

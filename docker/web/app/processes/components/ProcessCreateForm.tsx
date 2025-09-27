
// app/processes/ProcessCreateForm.tsx
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProcesses } from '@/app/_hooks/useProcesses';
import { queryKeys } from '@/app/_hooks/queryKeys';
import { listOwnerships, OwnershipView } from '@/lib/browser/isms/ownership';
import { ProcessView } from '@/lib/browser/isms/processes';

/**
 * A reusable, self-contained create form for Processes.
 *
 * Usage:
 * <ProcessCreateForm onCreated={() => refetch()} />
 *
 * You can pass a preloaded owners array to avoid an extra query.
 */
export default function ProcessCreateForm(props: {
  owners?: OwnershipView[];
  onCreated?: (created: ProcessView) => void;
  className?: string;
}) {
  const { owners: ownersProp, onCreated, className } = props;

  // Load owners only if not provided
  const ownersQuery = useQuery({
    queryKey: queryKeys.ownership,
    queryFn: listOwnerships,
    enabled: !ownersProp,
  });

  const owners = useMemo(() => ownersProp ?? ownersQuery.data ?? [], [ownersProp, ownersQuery.data]);

  const { create } = useProcesses();

  // Local form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState<string>('');

  const pending = create.isPending;

  return (
    <div className={className}>
      <h2 className="text-lg font-medium mb-2">Create process</h2>

      <form
        className="grid gap-2 md:grid-cols-4"
        onSubmit={e => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;

          create.mutate(
            {
              id: '',
              name: trimmed,
              description: description.trim() || null,
              owner: owners.find(o => o.id === ownerId) || null,
            },
            {
              onSuccess: rows => {
                // postgrest returns representation; take first row
                const created = Array.isArray(rows) ? (rows[0] as ProcessView | undefined) : undefined;
                // clear form
                setName('');
                setDescription('');
                setOwnerId('');
                // notify parent
                if (created && onCreated) onCreated(created);
              },
            }
          );
        }}
      >
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <input
          className="border rounded-lg px-3 py-2 md:col-span-2"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <select
          className="border rounded-lg px-3 py-2"
          value={ownerId}
          onChange={e => setOwnerId(e.target.value)}
          disabled={!!ownersProp ? false : ownersQuery.isLoading}
        >
          <option value="">Owner (optional)</option>
          {owners.map(o => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        {(create.isError) && (
          <div className="md:col-span-4">
            <p className="text-sm text-red-600">{(create.error as Error)?.message}</p>
            <p className="text-xs text-neutral-500">
              Writes require <code>editor</code>; reads are allowed for <code>authenticated</code>.
            </p>
          </div>
        )}

        <div className="md:col-span-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
          >
            {pending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

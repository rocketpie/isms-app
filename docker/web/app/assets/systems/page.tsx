//app/assets/systems/page.tsx
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { listOwnerships } from '@/lib/browser/isms/ownership'
import { createSystem, deleteSystem, listSystems, updateSystem } from '@/lib/browser/isms/systems'
import { queryKeys } from '../../_hooks/queryKeys'
import { SystemView } from '@/lib/browser/isms/assetTypes'
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow'
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow'

/* ---------- Page ---------- */
export default function SystemsPage() {
  const queryClient = useQueryClient()

  const systemsQuery = useQuery({ queryKey: queryKeys.allSystems, queryFn: listSystems })
  const ownersQuery = useQuery({ queryKey: queryKeys.allOwnership, queryFn: listOwnerships })

  const create = useMutation({
    mutationFn: createSystem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allSystems }),
  })

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SystemView> }) =>
      updateSystem(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.allSystems })
      const prev = queryClient.getQueryData<SystemView[]>(queryKeys.allSystems)
      if (prev) {
        queryClient.setQueryData<SystemView[]>(
          queryKeys.allSystems,
          prev.map(s => (s.id === id ? { ...s, ...patch } : s))
        )
      }
      return { prev }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.allSystems, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.allSystems }),
  })

  const remove = useMutation({
    mutationFn: deleteSystem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allSystems }),
  })

  // Create form state
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [ownerId, setOwnerId] = useState<string>('')

  // Inline edit state
  // Record -> Map<key, value>
  const [editing, setEditing] = useState<
    Record<string, SystemView>
  >({})

  const systems = useMemo(() => systemsQuery.data ?? [], [systemsQuery.data])
  const owners = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data])

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        {(systemsQuery.isLoading || ownersQuery.isLoading) && <p>Loading…</p>}
        {(systemsQuery.error || ownersQuery.error) && (
          <p className="text-red-600 text-sm">
            {(systemsQuery.error as Error)?.message || (ownersQuery.error as Error)?.message}
          </p>
        )}
        {systems.length === 0 && !systemsQuery.isLoading && (
          <p className="text-neutral-600">No systems yet.</p>
        )}

        <ul className="grid gap-2">
          {systems.map(listItem => {
            const isEditing = editing[listItem.id] !== undefined
            const value = isEditing
              ? editing[listItem.id]
              : listItem

            return (
              <li key={listItem.id} className="bg-white border rounded-xl p-3">
                {isEditing ? (
                  <SimpleAssetEditorRow
                    value={listItem}
                    owners={owners}
                    disabled={update.isPending || remove.isPending}
                    onChange={draft => setEditing(prev => ({ ...prev, [listItem.id]: draft }))}
                    onSave={() => {
                      update.mutate({ id: listItem.id, patch: value });
                      setEditing(({ [listItem.id]: _omit, ...rest }) => rest);
                    }}
                    onDelete={() => {
                      const ok = confirm(
                        'Delete this system?\n\nNote: related junctions may cascade delete depending on FK policy.'
                      );
                      if (ok) remove.mutate(listItem.id);
                    }}
                    onCancel={() => setEditing(({ [listItem.id]: _omit, ...rest }) => rest)}
                  />
                ) : (
                  <SimpleAssetDisplayRow
                    value={listItem}
                    expanded={false}
                    // expanded={!!expanded[listItem.id]}
                    // onToggle={() => setExpanded(prev => ({ ...prev, [listItem.id]: !prev[listItem.id] }))}
                    onEdit={() => setEditing(prev => ({ ...prev, [listItem.id]: listItem }))}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h2 className="text-lg font-medium mb-2">Create system</h2>
        <form
          className="grid gap-2 md:grid-cols-4"
          onSubmit={e => {
            e.preventDefault()
            const trimmed = name.trim()
            if (!trimmed) return
            create.mutate(
              {
                id: '',
                name: trimmed,
                description: desc.trim() || null,
                owner: owners.find(o => o.id === ownerId) || null,
              },
              {
                onSuccess: () => {
                  setName('')
                  setDesc('')
                  setOwnerId('')
                },
              }
            )
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
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={ownerId}
            onChange={e => setOwnerId(e.target.value)}
          >
            <option value="">Ownership (optional)</option>
            {owners.map(o => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          {(create.isError || update.isError || remove.isError) && (
            <div className="md:col-span-4">
              <p className="text-sm text-red-600">
                {((create.error || update.error || remove.error) as Error)?.message}
              </p>
              <p className="text-xs text-neutral-500">
                Writes require <code>editor</code>; reads are allowed for <code>authenticated</code>.
              </p>
            </div>
          )}

          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
            >
              {create.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

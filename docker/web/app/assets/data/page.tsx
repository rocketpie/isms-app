//app/data/page.tsx
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { postgrest } from '@/lib/browser/api-isms'
import { queryKeys } from '../../_hooks/queryKeys'
import { listOwnerships, OwnershipView } from '@/lib/browser/isms/ownership'

type DataAssetView = {
  id: string
  name: string
  description: string | null
  owner: OwnershipView | null
}

type DataAssetRow = {
  id?: string
  name: string
  description: string | null
  owner_id: string | null
}

/* ---------- API ---------- */
async function listDataAssets() {
  return await postgrest<DataAssetView[]>(
    '/data?select=id,name,description,owner:ownership(id,name)&order=name.asc',
    { method: 'GET' }
  )
}

async function createDataAsset(input: DataAssetView) {
  // strip the owner view object
  const { id, owner, ...rest } = input
  // set the owner_id, if any
  const dataModel: DataAssetRow = {
    ...rest,
    owner_id: owner?.id ?? null
  }
  return await postgrest<DataAssetRow[]>('/data', {
    method: 'POST',
    body: JSON.stringify([dataModel]),
    headers: { Prefer: 'return=representation' },
  })
}

async function updateDataAsset(id: string, input: Partial<DataAssetView>) {
  // strip the owner view object
  const { owner, ...rest } = input
  // set the owner_id, if any
  const dataModel: Partial<DataAssetRow> = {
    ...rest,
    owner_id: owner?.id ?? null
  }
  return await postgrest<DataAssetRow[]>(
    `/data?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dataModel),
      headers: { Prefer: 'return=representation' },
    }
  )
}

async function deleteDataAsset(id: string) {
  return await postgrest<null>(`/data?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/* ---------- Page ---------- */
export default function DataPage() {
  const queryClient = useQueryClient()

  const dataQuery = useQuery({ queryKey: queryKeys.allData, queryFn: listDataAssets })
  const ownersQuery = useQuery({ queryKey: queryKeys.allOwnership, queryFn: listOwnerships })

  const create = useMutation({
    mutationFn: createDataAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allData }),
  })

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<DataAssetView> }) =>
      updateDataAsset(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.allData })
      const prev = queryClient.getQueryData<DataAssetView[]>(queryKeys.allData)
      if (prev) {
        queryClient.setQueryData<DataAssetView[]>(
          queryKeys.allData,
          prev.map(listItem => (listItem.id === id ? { ...listItem, ...patch } : listItem))
        )
      }
      return { prev }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.allData, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.allData }),
  })

  const remove = useMutation({
    mutationFn: deleteDataAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allData }),
  })

  // Create form state
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [ownerId, setOwnerId] = useState<string>('')

  // Inline edit state
  // Record -> Map<key, value>
  const [editing, setEditing] = useState<
    Record<string, DataAssetView>
  >({})

  const items = useMemo(() => dataQuery.data ?? [], [dataQuery.data])
  const owners = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data])

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Data</h1>
      </div>

      <div className="grid gap-2">
        {(dataQuery.isLoading || ownersQuery.isLoading) && <p>Loading…</p>}
        {(dataQuery.error || ownersQuery.error) && (
          <p className="text-red-600 text-sm">
            {(dataQuery.error as Error)?.message || (ownersQuery.error as Error)?.message}
          </p>
        )}
        {items.length === 0 && !dataQuery.isLoading && (
          <p className="text-neutral-600">No data assets yet.</p>
        )}

        <ul className="grid gap-2">
          {items.map(listItem => {
            const isEditing = editing[listItem.id] !== undefined
            const value = isEditing
              ? editing[listItem.id]
              : listItem

            return (
              <li key={listItem.id} className="bg-white border rounded-xl p-3">
                {isEditing ? (
                  <div className="grid gap-2 md:grid-cols-5">
                    <input
                      className="border rounded-lg px-3 py-2 md:col-span-1"
                      value={value.name}
                      onChange={e =>
                        setEditing(prev => ({
                          ...prev,
                          [listItem.id]: { ...prev[listItem.id], name: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="border rounded-lg px-3 py-2 md:col-span-2"
                      placeholder="Description (optional)"
                      value={value.description ?? ''}
                      onChange={e =>
                        setEditing(prev => ({
                          ...prev,
                          [listItem.id]: { ...prev[listItem.id], description: e.target.value },
                        }))
                      }
                    />
                    <select
                      className="border rounded-lg px-3 py-2 md:col-span-1"
                      value={value.owner?.id}
                      onChange={e =>
                        setEditing(prev => ({
                          ...prev,
                          [listItem.id]: { ...prev[listItem.id], owner: owners.find(o => o.id === e.target.value) ?? null },
                        }))
                      }
                    >
                      <option value="">Owner (optional)</option>
                      {owners.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 md:col-span-1">
                      <button
                        className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
                        disabled={update.isPending || value.name.trim().length === 0}
                        onClick={() => {
                          const patch: Partial<DataAssetView> = {
                            name: value.name.trim(),
                            description: value.description?.trim() || null,
                            owner: value.owner || null,
                          }
                          update.mutate({ id: listItem.id, patch })
                          setEditing(prev => {
                            const { [listItem.id]: _omit, ...rest } = prev
                            return rest
                          })
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="rounded-xl px-3 py-2 border bg-white"
                        onClick={() =>
                          setEditing(prev => {
                            const { [listItem.id]: _omit, ...rest } = prev
                            return rest
                          })
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-1 md:grid-cols-5 md:items-center">
                    <div className="font-medium">{listItem.name}</div>
                    <div className="text-sm text-neutral-700 md:col-span-2">
                      {listItem.description ? (
                        <span className="text-neutral-600">{listItem.description}</span>
                      ) : (
                        <span className="text-neutral-400">No description</span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-700">
                      Owner: <span className="text-neutral-600">{listItem.owner?.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl px-3 py-2 border bg-white"
                        onClick={() =>
                          setEditing(prev => ({
                            ...prev,
                            [listItem.id]: listItem,
                          }))
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-xl px-3 py-2 border bg-white text-red-600 disabled:opacity-60"
                        disabled={remove.isPending}
                        onClick={() => {
                          const ok = confirm(
                            'Delete this data asset?\n\nNote: if referenced by junctions (e.g., system_data), deletion may be blocked by foreign keys.'
                          )
                          if (ok) remove.mutate(listItem.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h2 className="text-lg font-medium mb-2">Create data asset</h2>
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
                owner: owners.find(o => o.id === ownerId) || null
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
            <option value="">Owner (optional)</option>
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

//app/systems/page.tsx
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { postgrest } from '@/lib/browser/api-isms'

type System = {
  id: string
  name: string
  owner_id: string | null
  description: string | null
}

type Ownership = {
  id: string
  name: string
  primary_person_id: string | null
  deputy_person_id: string | null
}

/* ---------- API ---------- */
async function listSystems() {
  // GET /systems?select=id,name,description,owner_id&order=name.asc
  return await postgrest<System[]>(
    '/systems?select=id,name,description,owner_id&order=name.asc',
    { method: 'GET' }
  )
}

async function listOwnerships() {
  // GET /ownership?select=id,name&order=name.asc
  return await postgrest<Ownership[]>(
    '/ownership?select=id,name,primary_person_id,deputy_person_id&order=name.asc',
    { method: 'GET' }
  )
}

async function createSystem(input: {
  name: string
  description?: string
  owner_id?: string | null
}) {
  return await postgrest<System[]>('/systems', {
    method: 'POST',
    body: JSON.stringify([input]),
    headers: { Prefer: 'return=representation' },
  })
}

async function updateSystem(id: string, patch: Partial<System>) {
  return await postgrest<System[]>(
    `/systems?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
      headers: { Prefer: 'return=representation' },
    }
  )
}

async function deleteSystem(id: string) {
  return await postgrest<null>(`/systems?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

/* ---------- Page ---------- */
export default function SystemsPage() {
  const queryClient = useQueryClient()

  const systemsQuery = useQuery({ queryKey: ['systems'], queryFn: listSystems })
  const ownersQuery = useQuery({ queryKey: ['ownership'], queryFn: listOwnerships })

  const create = useMutation({
    mutationFn: createSystem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systems'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<System> }) =>
      updateSystem(id, patch),
    // optimistic update
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['systems'] })
      const prev = queryClient.getQueryData<System[]>(['systems'])
      if (prev) {
        queryClient.setQueryData<System[]>(
          ['systems'],
          prev.map(s => (s.id === id ? { ...s, ...patch } : s))
        )
      }
      return { prev }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['systems'], ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['systems'] }),
  })

  const remove = useMutation({
    mutationFn: deleteSystem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systems'] }),
  })

  // Create form state
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [ownerId, setOwnerId] = useState<string>('')

  // Inline edit state
  const [editing, setEditing] = useState<
    Record<string, { name: string; description: string; owner_id: string | '' }>
  >({})

  const systems = useMemo(() => systemsQuery.data ?? [], [systemsQuery.data])
  const owners = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data])
  const ownerById = useMemo(() => new Map(owners.map(o => [o.id, o.name] as const)), [owners])

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Systems</h1>
      </div>

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
          {systems.map(sys => {
            const isEditing = editing[sys.id] !== undefined
            const value = isEditing
              ? editing[sys.id]
              : {
                  name: sys.name,
                  description: sys.description ?? '',
                  owner_id: sys.owner_id ?? '',
                }
            const ownerLabel = sys.owner_id ? ownerById.get(sys.owner_id) ?? '—' : '—'

            return (
              <li key={sys.id} className="bg-white border rounded-xl p-3">
                {isEditing ? (
                  <div className="grid gap-2 md:grid-cols-5">
                    <input
                      className="border rounded-lg px-3 py-2 md:col-span-1"
                      value={value.name}
                      onChange={e =>
                        setEditing(prev => ({
                          ...prev,
                          [sys.id]: { ...prev[sys.id], name: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="border rounded-lg px-3 py-2 md:col-span-2"
                      placeholder="Description (optional)"
                      value={value.description}
                      onChange={e =>
                        setEditing(prev => ({
                          ...prev,
                          [sys.id]: { ...prev[sys.id], description: e.target.value },
                        }))
                      }
                    />
                    <select
                      className="border rounded-lg px-3 py-2 md:col-span-1"
                      value={value.owner_id}
                      onChange={e =>
                        setEditing(prev => ({
                          ...prev,
                          [sys.id]: { ...prev[sys.id], owner_id: e.target.value },
                        }))
                      }
                    >
                      <option value="">Ownership (optional)</option>
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
                          const patch: Partial<System> = {
                            name: value.name.trim(),
                            description: value.description.trim() || null,
                            owner_id: value.owner_id || null,
                          }
                          update.mutate({ id: sys.id, patch })
                          setEditing(prev => {
                            const { [sys.id]: _omit, ...rest } = prev
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
                            const { [sys.id]: _omit, ...rest } = prev
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
                    <div className="font-medium">{sys.name}</div>
                    <div className="text-sm text-neutral-700 md:col-span-2">
                      {sys.description ? (
                        <span className="text-neutral-600">{sys.description}</span>
                      ) : (
                        <span className="text-neutral-400">No description</span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-700">
                      Ownership: <span className="text-neutral-600">{ownerLabel}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl px-3 py-2 border bg-white"
                        onClick={() =>
                          setEditing(prev => ({
                            ...prev,
                            [sys.id]: {
                              name: sys.name,
                              description: sys.description ?? '',
                              owner_id: sys.owner_id ?? '',
                            },
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
                            'Delete this system?\n\nNote: if this system is referenced by junctions (e.g., application_systems, system_data), deletion may be blocked by FKs.'
                          )
                          if (ok) remove.mutate(sys.id)
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
        <h2 className="text-lg font-medium mb-2">Create system</h2>
        <form
          className="grid gap-2 md:grid-cols-4"
          onSubmit={e => {
            e.preventDefault()
            const trimmed = name.trim()
            if (!trimmed) return
            create.mutate(
              {
                name: trimmed,
                description: desc.trim() || undefined,
                owner_id: ownerId || null,
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

'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { postgrest } from '@/lib/browser/api-isms'

type Application = {
  id: string
  name: string
  owner_id: string | null
  description: string | null
}

async function listApplications() {
  // GET /applications?select=id,name,description&order=name
  return await postgrest<Application[]>('/applications?select=id,name,description&order=name.asc', { method: 'GET' });
}

async function createApplication(input: { name: string; description?: string }) {
  return await postgrest<Application[]>('/applications', {
    method: 'POST',
    body: JSON.stringify([input]), // PostgREST prefers array for bulk/return=representation
    headers: { Prefer: 'return=representation' }
  })
}

export default function ApplicationsPage() {
  const qc = useQueryClient()
  const apps = useQuery({ queryKey: ['applications'], queryFn: listApplications })
  const create = useMutation({
    mutationFn: createApplication,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] })
  })

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Applications</h1>
      </div>

      <div className="grid gap-2">
        {apps.isLoading && <p>Loading…</p>}
        {apps.error && <p className="text-red-600 text-sm">{(apps.error as Error).message}</p>}
        {apps.data?.length === 0 && <p className="text-neutral-600">No applications yet.</p>}
        <ul className="grid gap-2">
          {apps.data?.map(a => (
            <li key={a.id} className="bg-white border rounded-xl p-3">
              <div className="font-medium">{a.name}</div>
              {a.description && <div className="text-sm text-neutral-600">{a.description}</div>}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h2 className="text-lg font-medium mb-2">Create application</h2>
        <form
          className="grid gap-2"
          onSubmit={e => {
            e.preventDefault()
            create.mutate({ name, description: desc || undefined })
            setName('')
            setDesc('')
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
            className="border rounded-lg px-3 py-2"
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
          >
            {create.isPending ? 'Creating…' : 'Create'}
          </button>
          <p className="text-xs text-neutral-500">
            Requires <code>editor</code> role per RLS policy. Signed-in <code>authenticated</code> users can read.
          </p>
        </form>
      </div>
    </div>
  )
}

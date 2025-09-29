// app/assets/components/SimpleAssetCreateForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/app/_hooks/queryKeys'
import { listOwnerships, OwnershipView } from '@/lib/browser/isms/ownership'
import { BaseAssetView } from '@/lib/browser/isms/assetTypes'

/**
 * Generic create form for ISMS base assets (application, system, process, data, location, connection).
 * It fetches owners (unless provided), manages local state, and calls the provided mutation.
 * You control how the mutation input is built via `toInput`.
 */
export default function SimpleAssetCreateForm(props: {
  /* e.g., "Create Application" */
  title?: string
  className?: string
  /** Optional pre-fetched owners to skip the owners query */
  owners?: OwnershipView[]
  /** Called with the new Asset */
  onSubmit: (newAsset: BaseAssetView) => Promise<any>,
}) {

  // Load owners only if not provided
  const ownersQuery = useQuery({
    queryKey: queryKeys.allOwnership,
    queryFn: listOwnerships,
    enabled: !props.owners
  })

  const owners = useMemo(() => props.owners ?? ownersQuery.data ?? [], [props.owners, ownersQuery.data])

  // Local form state
  const [pending, setPending] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ownerId, setOwnerId] = useState<string>('')
  const [error, setError] = useState<Error>()

  return (
    <div className={props.className}>
      <h2 className="text-lg font-medium mb-2">New {props.title}</h2>

      <form
        className="grid gap-2 md:grid-cols-4"
        onSubmit={(e) => {
          setPending(true)
          e.preventDefault()
          const nameTrimmed = name.trim()
          if (!nameTrimmed) return

          try {
            props.onSubmit({
              id: '',
              name: nameTrimmed,
              description: description.trim() || null,
              owner: owners.find(o => o.id === ownerId) || null,
            }).then(() => { setPending(false) })
          }
          catch (error) {
            setError(error as Error)
            setPending(false)
          }
        }}
      >
        <label className="sr-only" htmlFor="create-name">Name</label>
        <input
          id="create-name"
          className="border rounded-lg px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="sr-only" htmlFor="create-description">Description (optional)</label>
        <input
          id="create-description"
          className="border rounded-lg px-3 py-2 md:col-span-2"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="sr-only" htmlFor="create-owner">Owner</label>
        <select
          id="create-owner"
          className="border rounded-lg px-3 py-2"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          disabled={!!props.owners ? false : ownersQuery.isLoading}
        >
          <option value="">No Owner</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        {error && (
          <div className="md:col-span-4">
            <p className="text-sm text-red-600">{error?.message}</p>
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
  )
}


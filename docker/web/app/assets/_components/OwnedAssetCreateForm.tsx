//app/assets/_components/OwnedAssetCreateForm.tsx
//Description: Generic create form for ISMS assets with owners (application, system, process, data, location, connection).
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/_hooks/queryKeys";
import { OwnedAssetView, OwnershipView } from "@/lib/browser/isms/assetTypes";
import { listOwnerships } from "@/lib/browser/isms/ownership";
import { Plus } from "lucide-react";

/**
 * Generic create form for ISMS base assets (application, system, process, data, location, connection).
 * It fetches owners (unless provided), manages local state, and calls the provided mutation.
 * You control how the mutation input is built via `toInput`.
 */
export default function OwnedAssetCreateForm<T extends OwnedAssetView>(props: {
  className?: string;
  /* e.g., "Application" */
  assetTypeName?: string;
  /** Optional pre-fetched owners to skip the owners query */
  owners?: OwnershipView[];
  /** Called with the new Asset */
  onSubmit: (newAsset: T) => Promise<any>;
  extraEditor?: React.ReactNode;
}) {
  // Load owners only if not provided
  const ownersQuery = useQuery({
    queryKey: queryKeys.assets.all("ownership"),
    queryFn: listOwnerships,
    enabled: !props.owners,
  });

  const owners = useMemo(
    () => props.owners ?? ownersQuery.data ?? [],
    [props.owners, ownersQuery.data],
  );

  // Local form state
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [error, setError] = useState<Error>();

  return (
    <div className={props.className}>
      <h2 className="text-lg font-medium mb-2">New {props.assetTypeName}</h2>

      <form
        className="grid gap-2 md:grid-cols-[1fr,2fr,1fr,1fr,auto]"
        onSubmit={async (e) => {
          setPending(true);
          e.preventDefault();
          const nameTrimmed = name.trim();
          if (!nameTrimmed) return;

          try {
            await props
              .onSubmit({
                id: "",
                name: nameTrimmed,
                description: description.trim() || null,
                owner: owners.find((o) => o.id === ownerId) || null,
              } as T)
              .then(() => {
                setPending(false);
              });
          } catch (error) {
            setError(error as Error);
          }
          finally {
            setPending(false)
          }
        }}
      >
        <div>
          <label className="sr-only" htmlFor="create-name">
            Name
          </label>
          <input
            id="create-name"
            className="border rounded-lg px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="sr-only" htmlFor="create-description">
            Description (optional)
          </label>
          <input
            id="create-description"
            className="border rounded-lg px-3 py-2 md:col-span-2"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          {props.extraEditor ?? ""}
        </div>

        <div className="flex flex-col">
          <label
            className="text-sm text-neutral-700 mb-1"
            htmlFor="create-owner">
            Owner
          </label>
          <select
            id="create-owner"
            className="border rounded-lg px-3 py-2"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            disabled={!!props.owners ? false : ownersQuery.isLoading}
          >
            <option value="">No Owner</option>
            {owners.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
        >
          <Plus className="h-5 w-5" />
        </button>

        {error && (
          <div className="md:col-span-4">
            <p className="text-sm text-red-600">{error?.message}</p>
          </div>
        )}
      </form>
    </div >
  );
}

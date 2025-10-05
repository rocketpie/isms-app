//app/assets/_components/SimpleAssetCreateForm.tsx
//Description: Generic create form for ISMS base assets (people, dataCategory).
"use client";

import { BaseAssetView } from "@/lib/browser/isms/assetTypes";
import { useState } from "react";

/**
 * Generic create form for ISMS base assets (person, dataCategory).
 */
export default function SimpleAssetCreateForm<T extends BaseAssetView>(props: {
  /* e.g., "Person" */
  assetTypeName?: string;
  className?: string;
  /** Called with the new Asset */
  onSubmit: (newAsset: T) => Promise<any>;
}) {
  // Local form state
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<Error>();

  return (
    <div className={props.className}>
      <h2 className="text-lg font-medium mb-2">New {props.assetTypeName}</h2>

      <form
        className="grid gap-2 md:grid-cols-4"
        onSubmit={(e) => {
          setPending(true);
          e.preventDefault();
          const nameTrimmed = name.trim();
          if (!nameTrimmed) return;

          try {
            props
              .onSubmit({
                id: "",
                name: nameTrimmed,
                description: description.trim() || null,
              } as T)
              .then(() => {
                setPending(false);
              });
          } catch (error) {
            setError(error as Error);
            setPending(false);
          }
        }}
      >
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

        {error && (
          <div className="md:col-span-4">
            <p className="text-sm text-red-600">{error?.message}</p>
            <p className="text-xs text-neutral-500">
              Writes require <code>editor</code>; reads are allowed for{" "}
              <code>authenticated</code>.
            </p>
          </div>
        )}

        <div className="md:col-span-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

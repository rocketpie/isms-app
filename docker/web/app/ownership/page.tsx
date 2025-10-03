//app/ownership/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { postgrest } from "@/lib/browser/api-isms";
import { queryKeys } from "../_hooks/queryKeys";

type Person = {
  id: string;
  name: string;
};

type Ownership = {
  id: string;
  name: string;
  primary_person_id: string | null;
  deputy_person_id: string | null;
};

// ------- API --------
async function listPeople() {
  // GET /people?select=id,name&order=name.asc
  return await postgrest<Person[]>("/people?select=id,name&order=name.asc", {
    method: "GET",
  });
}

async function listOwnerships() {
  // GET /ownership?select=id,name,primary_person_id,deputy_person_id&order=name.asc
  return await postgrest<Ownership[]>(
    "/ownership?select=id,name,primary_person_id,deputy_person_id&order=name.asc",
    { method: "GET" },
  );
}

async function createOwnership(input: {
  name: string;
  primary_person_id?: string | null;
  deputy_person_id?: string | null;
}) {
  return await postgrest<Ownership[]>("/ownership", {
    method: "POST",
    body: JSON.stringify([input]),
    headers: { Prefer: "return=representation" },
  });
}

async function updateOwnership(id: string, patch: Partial<Ownership>) {
  return await postgrest<Ownership[]>(
    `/ownership?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
      headers: { Prefer: "return=representation" },
    },
  );
}

async function deleteOwnership(id: string) {
  return await postgrest<null>(`/ownership?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ------- Page --------
export default function OwnershipPage() {
  const queryClient = useQueryClient();

  const peopleQuery = useQuery({
    queryKey: queryKeys.assets.all("people"),
    queryFn: listPeople,
  });
  const ownershipQuery = useQuery({
    queryKey: queryKeys.assets.all("ownership"),
    queryFn: listOwnerships,
  });

  const create = useMutation({
    mutationFn: createOwnership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all("ownership") });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Ownership> }) =>
      updateOwnership(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assets.all("ownership") });
      const prev = queryClient.getQueryData<Ownership[]>(
        queryKeys.assets.all("ownership"),
      );
      if (prev) {
        queryClient.setQueryData<Ownership[]>(
          queryKeys.assets.all("ownership"),
          prev.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.assets.all("ownership"), ctx.prev);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all("ownership") }),
  });

  const remove = useMutation({
    mutationFn: deleteOwnership,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all("ownership") }),
  });

  // Create form state
  const [newName, setNewName] = useState("");
  const [newPrimary, setNewPrimary] = useState<string>("");
  const [newDeputy, setNewDeputy] = useState<string>("");

  // Inline edit state per row
  const [editing, setEditing] = useState<
    Record<
      string,
      {
        name: string;
        primary_person_id: string | "";
        deputy_person_id: string | "";
      }
    >
  >({});

  const people = useMemo(() => peopleQuery.data ?? [], [peopleQuery.data]);
  const peopleById = useMemo(
    () => new Map(people.map((p) => [p.id, p] as const)),
    [people],
  );

  const ownerships = useMemo(
    () => ownershipQuery.data ?? [],
    [ownershipQuery.data],
  );

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Teams</h1>
      </div>

      <div className="grid gap-2">
        {(peopleQuery.isLoading || ownershipQuery.isLoading) && <p>Loading…</p>}
        {(peopleQuery.error || ownershipQuery.error) && (
          <p className="text-red-600 text-sm">
            {(peopleQuery.error as Error)?.message ||
              (ownershipQuery.error as Error)?.message}
          </p>
        )}
        {ownerships.length === 0 && !ownershipQuery.isLoading && (
          <p className="text-neutral-600">No ownerships yet.</p>
        )}

        <ul className="grid gap-2">
          {ownerships.map((o) => {
            const isEditing = editing[o.id] !== undefined;
            const value = isEditing
              ? editing[o.id]
              : {
                  name: o.name,
                  primary_person_id: o.primary_person_id ?? "",
                  deputy_person_id: o.deputy_person_id ?? "",
                };

            const primaryLabel = o.primary_person_id
              ? (peopleById.get(o.primary_person_id)?.name ?? "—")
              : "—";
            const deputyLabel = o.deputy_person_id
              ? (peopleById.get(o.deputy_person_id)?.name ?? "—")
              : "—";

            return (
              <li key={o.id} className="bg-white border rounded-xl p-3">
                {isEditing ? (
                  <div className="grid gap-2 md:grid-cols-4">
                    <input
                      className="border rounded-lg px-3 py-2"
                      value={value.name}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [o.id]: { ...prev[o.id], name: e.target.value },
                        }))
                      }
                    />
                    <select
                      className="border rounded-lg px-3 py-2"
                      value={value.primary_person_id}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [o.id]: {
                            ...prev[o.id],
                            primary_person_id: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">Primary person (optional)</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border rounded-lg px-3 py-2"
                      value={value.deputy_person_id}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [o.id]: {
                            ...prev[o.id],
                            deputy_person_id: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">Deputy (optional)</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
                        disabled={
                          update.isPending || value.name.trim().length === 0
                        }
                        onClick={() => {
                          const patch: Partial<Ownership> = {
                            name: value.name.trim(),
                            primary_person_id: value.primary_person_id || null,
                            deputy_person_id: value.deputy_person_id || null,
                          };
                          update.mutate({ id: o.id, patch });
                          setEditing((prev) => {
                            const { [o.id]: _omit, ...rest } = prev;
                            return rest;
                          });
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="rounded-xl px-3 py-2 border bg-white"
                        onClick={() =>
                          setEditing((prev) => {
                            const { [o.id]: _omit, ...rest } = prev;
                            return rest;
                          })
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-1 md:grid-cols-4 md:items-center">
                    <div className="font-medium">{o.name}</div>
                    <div className="text-sm text-neutral-700">
                      Primary:{" "}
                      <span className="text-neutral-600">{primaryLabel}</span>
                    </div>
                    <div className="text-sm text-neutral-700">
                      Deputy:{" "}
                      <span className="text-neutral-600">{deputyLabel}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl px-3 py-2 border bg-white"
                        onClick={() =>
                          setEditing((prev) => ({
                            ...prev,
                            [o.id]: {
                              name: o.name,
                              primary_person_id: o.primary_person_id ?? "",
                              deputy_person_id: o.deputy_person_id ?? "",
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
                            "Delete this ownership?\n\nNote: if referenced by applications/processes/systems (owner_id), the delete will fail due to FK constraints.",
                          );
                          if (ok) remove.mutate(o.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h2 className="text-lg font-medium mb-2">Create ownership</h2>
        <form
          className="grid gap-2 md:grid-cols-4 md:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            const name = newName.trim();
            if (!name) return;
            create.mutate(
              {
                name,
                primary_person_id: newPrimary || null,
                deputy_person_id: newDeputy || null,
              },
              {
                onSuccess: () => {
                  setNewName("");
                  setNewPrimary("");
                  setNewDeputy("");
                },
              },
            );
          }}
        >
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Ownership name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={newPrimary}
            onChange={(e) => setNewPrimary(e.target.value)}
          >
            <option value="">Primary person (optional)</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded-lg px-3 py-2"
            value={newDeputy}
            onChange={(e) => setNewDeputy(e.target.value)}
          >
            <option value="">Deputy (optional)</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
            >
              {create.isPending ? "Creating…" : "Create"}
            </button>
          </div>

          {(create.isError || update.isError || remove.isError) && (
            <div className="col-span-4">
              <p className="text-sm text-red-600">
                {
                  ((create.error || update.error || remove.error) as Error)
                    ?.message
                }
              </p>
              <p className="text-xs text-neutral-500">
                Hint: Deletes will fail if referenced by
                Applications/Processes/Systems. Writes require{" "}
                <code>editor</code> role; reads require{" "}
                <code>authenticated</code>.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

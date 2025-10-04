//app/people/page.tsx
//Description: display, manage People
"use client";

import { useMemo, useState } from "react";
import { usePeople } from "../_hooks/useAssets";

export default function PeoplePage() {
  const { list, create, update, remove } = usePeople();

  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const people = useMemo(() => list.data ?? [], [list.data]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">People</h1>
      </div>

      <div className="grid gap-2">
        {list.isLoading && <p>Loading…</p>}
        {list.error && (
          <p className="text-red-600 text-sm">
            {(list.error as Error).message}
          </p>
        )}
        {people.length === 0 && !list.isLoading && (
          <p className="text-neutral-600">No people yet.</p>
        )}

        <ul className="grid gap-2">
          {people.map((listItem) => {
            const isEditing = editing[listItem.id] !== undefined;
            const value = isEditing ? editing[listItem.id] : listItem.name;

            return (
              <li
                key={listItem.id}
                className="bg-white border rounded-xl p-3 flex items-center gap-3"
              >
                {isEditing ? (
                  <>
                    <input
                      className="border rounded-lg px-3 py-2 flex-1"
                      value={value}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [listItem.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditing((prev) => {
                            const { [listItem.id]: _omit, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      autoFocus
                    />
                    <button
                      className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
                      disabled={update.isPending || value.trim().length === 0}
                      onClick={() => {
                        const newName = value.trim();
                        if (newName && newName !== listItem.name) {
                          update.mutate({
                            ...listItem,
                            name: newName
                          });
                        }
                        setEditing((prev) => {
                          const { [listItem.id]: _omit, ...rest } = prev;
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
                          const { [listItem.id]: _omit, ...rest } = prev;
                          return rest;
                        })
                      }
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="font-medium flex-1">{listItem.name}</div>
                    <button
                      className="rounded-xl px-3 py-2 border bg-white"
                      onClick={() =>
                        setEditing((prev) => ({
                          ...prev,
                          [listItem.id]: listItem.name,
                        }))
                      }
                    >
                      Rename
                    </button>
                    <button
                      className="rounded-xl px-3 py-2 border bg-white text-red-600 disabled:opacity-60"
                      disabled={remove.isPending}
                      onClick={() => {
                        const ok = confirm(
                          "Delete this listItem?\n\nNote: if this person is referenced in ownership, related ownerships may be deleted due to ON DELETE CASCADE.",
                        );
                        if (ok) remove.mutate(listItem.id);
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h2 className="text-lg font-medium mb-2">Create person</h2>
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = name.trim();
            if (!value) return;
            create.mutateAsync(
              {
                id: "",
                name: value,
                description: null,
              },
              {
                onSuccess: () => setName(""),
              },
            );
          }}
        >
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {create.isError && (
            <p className="text-sm text-red-600">
              {(create.error as Error).message}
            </p>
          )}
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
          >
            {create.isPending ? "Creating…" : "Create"}
          </button>
          <p className="text-xs text-neutral-500">
            Requires <code>editor</code> role per RLS policy. Signed-in{" "}
            <code>authenticated</code> users can read.
          </p>
        </form>
      </div>
    </div>
  );
}

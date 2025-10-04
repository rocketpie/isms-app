//lib/browser/isms/connections.ts
//Description: api-isms '/connections' CRUD, owner embedding
"use client";

import { postgrest } from "../api-isms";
import { ConnectionRow, ConnectionView } from "./assetTypes";

export async function listConnections() {
  return await postgrest<ConnectionView[]>(
    "/connections?select=id,name,description,owner:ownership(id,name)&order=name.asc",
    { method: "GET" },
  );
}

export async function createConnection(item: ConnectionView) {
  // strip the owner object
  const { id, owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: ConnectionRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  const response = await postgrest<ConnectionView[]>("/connections", {
    method: "POST",
    body: JSON.stringify([dataModel]),
    headers: { Prefer: "return=representation" },
  });

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateConnection(item: ConnectionView) {
  // strip the owner object
  const { id, owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: Partial<ConnectionRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  return await postgrest<null>(
    `/connections?id=eq.${encodeURIComponent(item.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(dataModel),
      headers: { Prefer: "return=representation" },
    },
  );
}

export async function deleteConnection(id: string) {
  return await postgrest<null>(`/connections?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

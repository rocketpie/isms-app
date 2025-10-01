//lib/browser/isms/systems.ts
"use client";

import { postgrest } from "../api-isms";
import { SystemRow, SystemView } from "./assetTypes";

export async function listSystems() {
  return await postgrest<SystemView[]>(
    "/systems?select=id,name,description,owner:ownership(id,name)&order=name.asc",
    { method: "GET" },
  );
}

export async function createSystem(item: SystemView) {
  // strip the owner object
  const { id, owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: SystemRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  const response = await postgrest<SystemView[]>("/systems", {
    method: "POST",
    body: JSON.stringify([dataModel]),
    headers: { Prefer: "return=representation" },
  });

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateSystem(item: SystemView) {
  // strip the owner object
  const { owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: Partial<SystemRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  return await postgrest<null>(
    `/systems?id=eq.${encodeURIComponent(item.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(dataModel),
      headers: { Prefer: "return=representation" },
    },
  );
}

export async function deleteSystem(id: string) {
  return await postgrest<null>(`/systems?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

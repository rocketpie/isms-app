//lib/browser/isms/dataAssets.ts
"use client";

import { postgrest } from "../api-isms";
import { DataAssetRow, DataAssetView } from "./assetTypes";

export async function listData() {
  return await postgrest<DataAssetView[]>(
    "/data?select=id,name,description,owner:ownership(id,name)&order=name.asc",
    { method: "GET" },
  );
}

export async function createData(item: DataAssetView) {
  // strip the owner object
  const { id, owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: DataAssetRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  const response = await postgrest<DataAssetView[]>("/data", {
    method: "POST",
    body: JSON.stringify([dataModel]),
    headers: { Prefer: "return=representation" },
  });

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateData(item: DataAssetView) {
  // strip the owner object
  const { owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: Partial<DataAssetRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  return await postgrest<null>(`/data?id=eq.${encodeURIComponent(item.id)}`, {
    method: "PATCH",
    body: JSON.stringify(dataModel),
    headers: { Prefer: "return=representation" },
  });
}

export async function deleteData(id: string) {
  return await postgrest<null>(`/data?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

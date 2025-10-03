//lib/browser/isms/system-data.ts
"use client";

import { postgrest } from "../api-isms";
import { DataAssetView } from "./assetTypes";

export async function listLinkedData(systemId: string) {
  const response = await postgrest<{ data_asset: DataAssetView }[]>(
    `/system_data?system_id=eq.${encodeURIComponent(systemId)}` +
      `&select=data_asset:data_assets(id,name,description,owner:ownership(id,name))` +
      `&order=data_asset(name).asc`,
    { method: "GET" },
  );
  return response.map((row) => row.data_asset);
}

export async function linkData(systemId: string, dataId: string) {
  await postgrest("/system_data", {
    method: "POST",
    body: JSON.stringify([{ system_id: systemId, data_id: dataId }]),
  });
}

export async function unlinkData(systemId: string, dataId: string) {
  return await postgrest<null>(
    `/system_data?system_id=eq.${encodeURIComponent(systemId)}` +
      `&data_id=eq.${encodeURIComponent(dataId)}`,
    { method: "DELETE" },
  );
}

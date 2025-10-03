//lib/browser/isms/applications.ts
//Description: api-isms '/applications' CRUD, owner embedding
"use client";

import { postgrest } from "../api-isms";
import { ApplicationRow, ApplicationView } from "./assetTypes";

export async function listApplications() {
  return await postgrest<ApplicationView[]>(
    "/applications?select=id,name,description,owner:ownership(id,name)&order=name.asc",
    { method: "GET" },
  );
}

export async function createApplication(item: ApplicationView) {
  // strip the owner object
  const { id, owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: ApplicationRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  const response = await postgrest<ApplicationView[]>("/applications", {
    method: "POST",
    body: JSON.stringify([dataModel]),
    headers: { Prefer: "return=representation" },
  });

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateApplication(item: ApplicationView) {
  // strip the owner object
  const { owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: Partial<ApplicationRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  return await postgrest<null>(
    `/applications?id=eq.${encodeURIComponent(item.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(dataModel),
      headers: { Prefer: "return=representation" },
    },
  );
}

export async function deleteApplication(id: string) {
  return await postgrest<null>(
    `/applications?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}

//lib/browser/isms/ownership.ts
//Description: api-isms '/ownership' CRUD, owner embedding
"use client";

import { postgrest } from "../api-isms";
import { OwnershipView, OwnershipRow } from "./assetTypes";


export async function listOwnerships() {
  // GET /ownership?select=id,name,primary_person_id,deputy_person_id&order=name.asc
  return await postgrest<OwnershipView[]>(
    "/ownership?select=id,name&order=name.asc",
    { method: "GET" },
  );
}

export async function createOwnership(item: OwnershipView) {
 // strip the person objects
  const { id, primary, deputy, ...rest } = item;
  // set the person_ids, if any
  const dataModel = {
    ...rest,
    primary_person_id: primary?.id ?? null,
    deputy_person_id: deputy?.id ?? null,
  };
  // POST /ownership { name, primary_person_id?, deputy_person_id? }
  const data = await postgrest<OwnershipRow[]>(
    "/ownership",
    {
      method: "POST",
      body: JSON.stringify(dataModel),
    },
  );

  return data[0].id;
}
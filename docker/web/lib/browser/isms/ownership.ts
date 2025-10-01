//lib/browser/isms/ownership.ts
"use client";

import { postgrest } from "../api-isms";

export type OwnershipView = {
  id: string;
  name: string;
};

export async function listOwnerships() {
  // GET /ownership?select=id,name,primary_person_id,deputy_person_id&order=name.asc
  return await postgrest<OwnershipView[]>(
    "/ownership?select=id,name&order=name.asc",
    { method: "GET" },
  );
}

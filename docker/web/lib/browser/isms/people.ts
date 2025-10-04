import { postgrest } from "../api-isms";
import { PersonView, PersonRow } from "./assetTypes";

export async function listPeople() {
  return await postgrest<PersonView[]>(
    "/people?select=id,name&order=name.asc",
    { method: "GET" }
  );
}

export async function createPerson(item: PersonView) {
  const { id, description, ...rest } = item;
  const dataModel: Partial<PersonRow> = { ...rest };
  const response = await postgrest<PersonView[]>(
    "/people",
    {
      method: "POST",
      body: JSON.stringify([dataModel]),
      headers: { Prefer: "return=representation" },
    }
  );
  return response[0].id;
}

export async function updatePerson(item: PersonView) {
  const { id, description, ...rest } = item;
  const dataModel: Partial<PersonRow> = { ...rest };
  return await postgrest<null>(`/people?id=eq.${encodeURIComponent(item.id)}`, {
    method: "PATCH",
    body: JSON.stringify(dataModel),
  });
}

export async function deletePerson(id: string) {
  return await postgrest<null>(`/people?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

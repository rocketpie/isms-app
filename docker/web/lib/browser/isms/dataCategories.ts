//lib/browser/isms/dataCategories.ts
 
import { postgrest } from "../api-isms";
import { DataCategoryRow, DataCategoryView } from "./assetTypes";


export async function listDataCategories() {
  return await postgrest<DataCategoryView[]>(
    "/data_categories?select=id,name&order=name.asc",
    { method: "GET" }
  );
}

export async function createDataCategory(item: DataCategoryView) {
  const { id, ...rest } = item;
  const dataModel: Partial<DataCategoryRow> = { ...rest };
  const response = await postgrest<DataCategoryView[]>(
    "/data_categories",
    {
      method: "POST",
      body: JSON.stringify([dataModel]),
      headers: { Prefer: "return=representation" },
    }
  );

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateDataCategory(item: DataCategoryView) {
  return await postgrest<null>(`/data_categories?id=eq.${encodeURIComponent(item.id)}`, {
    method: "PATCH",
    body: JSON.stringify(item),
  });
}

export async function deleteDataCategory(id: string) {
  return await postgrest<null>(`/data_categories?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
} 

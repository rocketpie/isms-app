//lib/browser/isms/maps.ts
 
"use client";

import { postgrest } from "../api-isms";
import { AssetKind, MapRow, MapView } from "./assetTypes";

export type MapIconView = {
  id: string;
  name: string;
  data_version: number;
  data: {
    url: string | null;
    svg: string | null;
  };
};

export type MapIconRow = {
  id?: string;
  name?: string;
  data_version: number;
  data: unknown; // jsonb (svg/url/style etc.)
};


export type MapNodeView = {
  id: string;
  map_id: string;
  asset_kind: AssetKind;
  asset_id: string;
  map_x: number;
  map_y: number;
  icon?: MapIconRow | null; // embedded
  data_version: number;
  data: {
    label: string | null;
  };
};

export type MapNodeRow = {
  id?: string;
  map_id: string;
  asset_kind: AssetKind;
  asset_id: string;
  map_x: number;
  map_y: number;
  icon_id?: string | null;
  data_version: number;
  data: unknown; // jsonb (annotation/style/labels)
};


// Maps CRUD
// ###########################################################################

export async function listMaps() {
  return await postgrest<MapView[]>(
    "/maps?select=id,name,description,owner:ownership(id,name)&order=name.asc",
    { method: "GET" }
  );
}

export async function createMap(item: MapView) {
  // strip the owner object
  const { id, owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: MapRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  const response = await postgrest<MapRow[]>(
    "/maps",
    {
      method: "POST",
      body: JSON.stringify([dataModel]),
      headers: { Prefer: "return=representation" },
    }
  );

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateMap(item: MapView) {
  // strip the owner object
  const { id, owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: MapRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  return await postgrest<null>(
    `/maps?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(dataModel),
    }
  );
}

export async function deleteMap(id: string) {
  return await postgrest<null>(
    `/maps?id=eq.${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}



// MapIcons CRUD
// ###########################################################################

export async function listMapIcons() {
  return await postgrest<MapIconView[]>(
    "/map_icons?select=id,name,data_version,data&order=name.asc",
    { method: "GET" }
  );
}

export async function createMapIcon(item: MapIconView) {
  // strip id, data
  const { id, data, ...rest } = item;
  const dataModel: MapIconRow = {
    ...rest,
    data: JSON.stringify(data)
  };
  const response = await postgrest<MapIconRow[]>(
    "/map_icons",
    {
      method: "POST",
      body: JSON.stringify([dataModel]),
      headers: { Prefer: "return=representation" },
    }
  );

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateMapIcon(item: MapIconView) {
  // strip id, data
  const { id, data, ...rest } = item;
  const dataModel: MapIconRow = {
    ...rest,
    data: JSON.stringify(data)
  };
  return await postgrest<null>(
    `/map_icons?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(dataModel),
      headers: { Prefer: "return=representation" },
    }
  );
}

export async function deleteMapIcon(id: string) {
  return await postgrest<null>(
    `/map_icons?id=eq.${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}



// MapNodes CRUD
// ###########################################################################

export async function listMapNodes(mapId: string) {
  return await postgrest<MapNodeView[]>(
    `/map_nodes?select=id,map_id,asset_kind,asset_id,map_x,map_y,icon:map_icons(id,name,data_version,data),data_version,data&map_id=eq.${encodeURIComponent(
      mapId
    )}`,
    { method: "GET" }
  );
}

export async function createMapNode(item: MapNodeView) {
  // strip id, data, icon
  const { id, data, icon, ...rest } = item;
  const dataModel: MapNodeRow = {
    ...rest,
    data: JSON.stringify(data),
    icon_id: icon?.id ?? null,
  };
  const response = await postgrest<MapNodeRow[]>(
    "/map_nodes",
    {
      method: "POST",
      body: JSON.stringify([dataModel]),
      headers: { Prefer: "return=representation" },
    }
  );

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateMapNode(item: MapNodeView) {
  // strip id, data, icon
  const { id, data, icon, ...rest } = item;
  const dataModel: MapNodeRow = {
    ...rest,
    data: JSON.stringify(data),
    icon_id: icon?.id ?? null,
  };

  return await postgrest<null>(
    `/map_nodes?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify([dataModel]),
    }
  );
}

export async function moveMapNode(id: string, mapX: number, mapY: number) {
  return await postgrest<null>(
    `/map_nodes?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify([{ map_x: mapX, map_y: mapY }]),
    }
  );
}

export async function deleteMapNode(id: string) {
  return await postgrest<null>(
    `/map_nodes?id=eq.${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

//app/_hooks/useMaps.ts
//Description: hooks to CRUD maps, map_locations
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MapIconView, MapNodeView, MapView } from "@/lib/browser/isms/maps";
import {
  listMaps,
  createMap,
  updateMap,
  deleteMap,
  listMapIcons,
  createMapIcon,
  updateMapIcon,
  deleteMapIcon,
  listMapNodes,
  createMapNode,
  updateMapNode,
  deleteMapNode,
  moveMapNode,
} from "@/lib/browser/isms/maps";
import { queryKeys } from "./queryKeys";

/**
 * Query Keys for Maps feature
 * Keep keys stable and minimal; prefer per-collection keys for easy invalidation.
 */
export const mapQueryKeys = {
  maps: {
    all: () => ["maps", "all"] as const,
    byId: (id: string) => ["maps", "byId", id] as const,
  },
  icons: {
    all: () => ["map-icons", "all"] as const,
    byId: (id: string) => ["map-icons", "byId", id] as const,
  },
  nodes: {
    byMap: (mapId: string) => ["map-nodes", "byMap", mapId] as const,
    byId: (nodeId: string) => ["map-nodes", "byId", nodeId] as const,
  },
};



// Maps CRUD
// ###########################################################################

export function useMaps() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.maps.all,
    queryFn: listMaps,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: createMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.all });
    },
  });


  const update = useMutation({
    mutationFn: updateMap,
    // optimistic with input draft (server returns nothing)
    onMutate: async (draft: Partial<MapView> & { id: string }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.maps.all });

      const prevAll = queryClient.getQueryData<MapView[]>(queryKeys.maps.all);
      if (Array.isArray(prevAll)) {
        queryClient.setQueryData<MapView[]>(
          queryKeys.maps.all,
          prevAll.map((row) => (row.id === draft.id ? ({ ...row, ...draft } as MapView) : row)),
        );
      }

      return { prevAll };
    },
    onError: (_e, _draft, ctx) => {
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.maps.all, ctx.prevAll);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.all });
    },
  });

  const remove = useMutation({
    mutationFn: deleteMap,
    // optimistic with input id
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.maps.all });

      const prevAll = queryClient.getQueryData<MapView[]>(queryKeys.maps.all);

      if (Array.isArray(prevAll)) {
        queryClient.setQueryData<MapView[]>(
          queryKeys.maps.all,
          prevAll.filter((row) => row.id !== id),
        );
      }

      return { prevAll };
    },
    onError: (_e, _id, ctx) => {
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.maps.all, ctx.prevAll);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.all });
    },
  });

  return { list, create, update, remove }
}



// MapIcons CRUD
// ###########################################################################

export function useMapIcons() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.maps.allMapIcons,
    queryFn: listMapIcons,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: createMapIcon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.allMapIcons });
    },
  });


  const update = useMutation({
    mutationFn: updateMapIcon,
    // optimistic with input draft (server returns nothing)
    onMutate: async (draft: Partial<MapIconView> & { id: string }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.maps.allMapIcons });

      const prevAll = queryClient.getQueryData<MapIconView[]>(queryKeys.maps.allMapIcons);
      if (Array.isArray(prevAll)) {
        queryClient.setQueryData<MapIconView[]>(
          queryKeys.maps.allMapIcons,
          prevAll.map((row) => (row.id === draft.id ? ({ ...row, ...draft } as MapIconView) : row)),
        );
      }

      return { prevAll };
    },
    onError: (_e, _draft, ctx) => {
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.maps.allMapIcons, ctx.prevAll);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.allMapIcons });
    },
  });

  const remove = useMutation({
    mutationFn: deleteMapIcon,
    // optimistic with input id
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.maps.allMapIcons });

      const prevAll = queryClient.getQueryData<MapIconView[]>(queryKeys.maps.allMapIcons);

      if (Array.isArray(prevAll)) {
        queryClient.setQueryData<MapIconView[]>(
          queryKeys.maps.allMapIcons,
          prevAll.filter((row) => row.id !== id),
        );
      }

      return { prevAll };
    },
    onError: (_e, _id, ctx) => {
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.maps.allMapIcons, ctx.prevAll);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.allMapIcons });
    },
  });

  return { list, create, update, remove }
}



// MapNodes CRUD
// ###########################################################################

export function useMapNodes(mapId: string) {
  const queryClient = useQueryClient();

  const list = useQuery({
    enabled: !!mapId,
    queryKey: queryKeys.maps.mapNodes(mapId),
    queryFn: () => listMapNodes(mapId),
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: (item: MapNodeView) => {
      item.map_id = mapId;
      return createMapNode(item)
    },
    onMutate: async (node) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.maps.mapNodes(mapId) });
      const prev = queryClient.getQueryData<MapNodeView[]>(queryKeys.maps.mapNodes(mapId),) || [];

      queryClient.setQueryData<MapNodeView[]>(
        queryKeys.maps.mapNodes(mapId),
        [...prev, node],
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.maps.mapNodes(mapId), ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.mapNodes(mapId) });
    },
  });

  const update = useMutation({
    mutationFn: updateMapNode,
    // optimistic with input draft (server returns nothing)
    onMutate: async (draft: MapNodeView & { id: string }) => {
      await queryClient.cancelQueries({
        predicate: (q) => queryKeys.maps.isMapNodeKey(q.queryKey),
      });

      const prevAll = queryClient.getQueryData<MapNodeView[]>(queryKeys.maps.allMapNodes);
      const prevMapNodes = queryClient.getQueryData<MapNodeView[]>(queryKeys.maps.mapNodes(mapId));

      if (Array.isArray(prevAll)) {
        queryClient.setQueryData<MapNodeView[]>(
          queryKeys.maps.all,
          prevAll.map((row) => (row.id === draft.id ? ({ ...row, ...draft } as MapNodeView) : row)),
        );
      }

      if (Array.isArray(prevMapNodes)) {
        queryClient.setQueryData<MapNodeView[]>(
          queryKeys.maps.mapNodes(mapId),
          prevMapNodes.map((row) => (row.id === draft.id ? ({ ...row, ...draft } as MapNodeView) : row)),
        );
      }

      return { prevAll, prevMapNodes };
    },
    onError: (_e, _draft, ctx) => {
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.maps.allMapNodes, ctx.prevAll);
      if (ctx.prevMapNodes) queryClient.setQueryData(queryKeys.maps.mapNodes(mapId), ctx.prevMapNodes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (q) => queryKeys.maps.isMapNodeKey(q.queryKey),
        refetchType: "active",
      });
    },
  });

  const move = useMutation({
    mutationFn: async ({ id, x, y }: { id: string, x: number, y: number }) => { return await moveMapNode(id, x, y) },
    onMutate: async ({ id, x, y }: { id: string, x: number, y: number }) => {
      const prevMapNodes = queryClient.getQueryData<MapNodeView[]>(queryKeys.maps.mapNodes(mapId));

      if (Array.isArray(prevMapNodes)) {
        queryClient.setQueryData<MapNodeView[]>(
          queryKeys.maps.mapNodes(mapId),
          prevMapNodes.map((row) => (row.id === id ? ({ ...row, map_x: x, map_y: y } as MapNodeView) : row)),
        );
      }

      return { prevMapNodes };
    },
    onError: (_e, _draft, ctx) => {
      if (!ctx) return;
      if (ctx.prevMapNodes) queryClient.setQueryData(queryKeys.maps.mapNodes(mapId), ctx.prevMapNodes);
    },
  });

  const remove = useMutation({
    mutationFn: deleteMapNode,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({
        predicate: (q) => queryKeys.maps.isMapNodeKey(q.queryKey),
      });

      const prevAll = queryClient.getQueryData<MapNodeView[]>(queryKeys.maps.allMapNodes);
      const prevMapNodes = queryClient.getQueryData<MapNodeView[]>(queryKeys.maps.mapNodes(mapId));

      if (Array.isArray(prevAll)) {
        queryClient.setQueryData<MapNodeView[]>(
          queryKeys.maps.all,
          prevAll.filter((item: MapNodeView) => item.id !== id),
        );
      }

      if (Array.isArray(prevMapNodes)) {
        queryClient.setQueryData<MapNodeView[]>(
          queryKeys.maps.mapNodes(mapId),
          prevMapNodes.filter((item: MapNodeView) => item.id !== id),
        );
      }
      return { prevAll, prevMapNodes };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.maps.allMapNodes, ctx.prevAll);
      if (ctx.prevMapNodes) queryClient.setQueryData(queryKeys.maps.mapNodes(mapId), ctx.prevMapNodes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (q) => queryKeys.maps.isMapNodeKey(q.queryKey),
        refetchType: "active",
      });
    },
  });

  return { list, create, update, move, remove }
}

//app/_hooks/useAssetsBase.ts
//Description: generic hooks for managing assets with React Query
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import type { AssetKind, BaseAssetView } from "@/lib/browser/isms/assetTypes";
import type { QueryKey } from "@tanstack/react-query";

type AssetApi<TView> = {
  list: () => Promise<TView[]>;
  create: (item: TView) => Promise<string>;
  update: (item: TView) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
};

export function useAssetsBase<
  TView extends BaseAssetView = BaseAssetView,
>(kind: AssetKind, api: AssetApi<TView>) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.assets.all(kind),
    queryFn: api.list,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all(kind) });
    },
  });

  const update = useMutation({
    mutationFn: api.update,
    // optimistic with input draft (server returns nothing)
    onMutate: async (draft: Partial<TView> & { id: string }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assets.all(kind) });
      await queryClient.cancelQueries({
        predicate: (q) => queryKeys.links.isForChild(q.queryKey, kind),
      });

      const prevAll = queryClient.getQueryData<TView[]>(queryKeys.assets.all(kind));
      const prevLinkedEntries = queryClient.getQueriesData<TView[]>({
        predicate: (q) => queryKeys.links.isForChild(q.queryKey, kind),
      });

      if (Array.isArray(prevAll)) {
        queryClient.setQueryData<TView[]>(
          queryKeys.assets.all(kind),
          prevAll.map((row) => (row.id === draft.id ? ({ ...row, ...draft } as TView) : row)),
        );
      }

      for (const [key, data] of prevLinkedEntries) {
        if (Array.isArray(data)) {
          queryClient.setQueryData<TView[]>(
            key as QueryKey,
            data.map((row) => (row.id === draft.id ? ({ ...row, ...draft } as TView) : row)),
          );
        }
      }

      return { prevAll, prevLinkedEntries };
    },
    onError: (_e, _draft, ctx) => {
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.assets.all(kind), ctx.prevAll);
      if (ctx.prevLinkedEntries) {
        for (const [key, data] of ctx.prevLinkedEntries) {
          queryClient.setQueryData(key as QueryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all(kind) });
      queryClient.invalidateQueries({
        predicate: (q) => queryKeys.links.isForChild(q.queryKey, kind),
        refetchType: "active",
      });
    },
  });

  const remove = useMutation({
    mutationFn: api.remove,
    // optimistic with input id
    onMutate: async (removedId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assets.all(kind) });
      await queryClient.cancelQueries({
        predicate: (q) => queryKeys.links.isForChild(q.queryKey, kind),
      });

      const prevAll = queryClient.getQueryData<TView[]>(queryKeys.assets.all(kind));
      const prevLinkedEntries = queryClient.getQueriesData<TView[]>({
        predicate: (q) => queryKeys.links.isForChild(q.queryKey, kind),
      });

      if (Array.isArray(prevAll)) {
        queryClient.setQueryData<TView[]>(
          queryKeys.assets.all(kind),
          prevAll.filter((row) => row.id !== removedId),
        );
      }
      for (const [key, data] of prevLinkedEntries) {
        if (Array.isArray(data)) {
          queryClient.setQueryData<TView[]>(
            key as QueryKey,
            data.filter((row) => row.id !== removedId),
          );
        }
      }

      return { prevAll, prevLinkedEntries };
    },
    onError: (_e, _id, ctx) => {
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.assets.all(kind), ctx.prevAll);
      if (ctx.prevLinkedEntries) {
        for (const [key, data] of ctx.prevLinkedEntries) {
          queryClient.setQueryData(key as QueryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all(kind) });
      queryClient.invalidateQueries({
        predicate: (q) => queryKeys.links.isForChild(q.queryKey, kind),
        refetchType: "active",
      });
    },
  });

  return { list, create, update, remove };
}

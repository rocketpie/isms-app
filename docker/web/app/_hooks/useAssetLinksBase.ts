//app/_hooks/useAssetLinkBase.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import type { AssetKind, BaseAssetView } from "@/lib/browser/isms/assetTypes";

type LinkApi<TChild extends BaseAssetView> = {
  listLinked: (parentId: string) => Promise<TChild[]>;
  link: (parentId: string, childId: string) => Promise<unknown>;
  unlink: (parentId: string, childId: string) => Promise<unknown>;
};

export function useAssetLinksBase<TChild extends BaseAssetView>(
  parentKind: AssetKind,
  parentId: string,
  childKind: AssetKind,
  api: LinkApi<TChild>,
  // pass the child asset hooks so we can forward create/update/remove
  childAssetHooks: {
    list: ReturnType<typeof useQuery<TChild[]>>;
    create: ReturnType<typeof useMutation<string, unknown, TChild, unknown>>;
    update: ReturnType<typeof useMutation<unknown, unknown, TChild, unknown>>;
    remove: ReturnType<typeof useMutation<unknown, unknown, string, unknown>>;
  },
) {
  const queryClient = useQueryClient();

  const listAll = childAssetHooks.list; // e.g., all applications

  const listLinked = useQuery({
    enabled: !!parentId,
    queryKey: queryKeys.links.list(parentKind, parentId, childKind),
    queryFn: () => api.listLinked(parentId),
    staleTime: 30_000,
  });

  const link = useMutation({
    mutationFn: (childId: string) => api.link(parentId, childId),
    onMutate: async (childId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.list(parentKind, parentId, childKind) });
      const prev = queryClient.getQueryData<TChild[]>(
        queryKeys.links.list(parentKind, parentId, childKind),
      ) || [];
      const child = (listAll.data || []).find((c: any) => c.id === childId);
      if (child) {
        queryClient.setQueryData<TChild[]>(
          queryKeys.links.list(parentKind, parentId, childKind),
          [...prev, (child as TChild)],
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.links.list(parentKind, parentId, childKind), ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links.list(parentKind, parentId, childKind) });
    },
  });

  const unlink = useMutation({
    mutationFn: (childId: string) => api.unlink(parentId, childId),
    onMutate: async (childId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.list(parentKind, parentId, childKind) });
      const prev = queryClient.getQueryData<TChild[]>(
        queryKeys.links.list(parentKind, parentId, childKind),
      ) || [];
      queryClient.setQueryData<TChild[]>(
        queryKeys.links.list(parentKind, parentId, childKind),
        prev.filter((c: any) => c.id !== childId),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.links.list(parentKind, parentId, childKind), ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links.list(parentKind, parentId, childKind) });
    },
  });

  return {
    listAll, // same shape you used before
    listLinked,
    link,
    unlink,
    // forward child CRUD
    create: childAssetHooks.create,
    update: childAssetHooks.update,
    remove: childAssetHooks.remove,
  };
}

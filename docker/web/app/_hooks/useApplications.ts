// app/_hooks/useApplications.ts
"use client";

import { QueryKey, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/_hooks/queryKeys";
import {
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from "@/lib/browser/isms/applications";
import type { ApplicationView } from "@/lib/browser/isms/assetTypes";

export function useApplications() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.allApplications,
    queryFn: listApplications,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allApplications });
    },
  });

  const update = useMutation({
    mutationFn: updateApplication,
    // draft is the variables you passed into mutate(draft)
    onMutate: async (draft: Partial<ApplicationView> & { id: string }) => {
      // pause queries so our patch doesn't get overwritten mid-flight
      await queryClient.cancelQueries({ queryKey: queryKeys.allApplications });
      await queryClient.cancelQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "processApplications",
      });

      // snapshot previous states to allow rollback
      const prevAll = queryClient.getQueryData<ApplicationView[]>(queryKeys.allApplications);
      const prevLinkedEntries = queryClient.getQueriesData<ApplicationView[]>({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "processApplications",
      });

      // optimistic patch for the global list
      if (prevAll) {
        queryClient.setQueryData<ApplicationView[]>(
          queryKeys.allApplications,
          prevAll.map((row) => (row.id === draft.id ? { ...row, ...draft } : row)),
        );
      }

      // optimistic patch for every cached linked list
      for (const [key, data] of prevLinkedEntries) {
        if (Array.isArray(data)) {
          queryClient.setQueryData<ApplicationView[]>(
            key as QueryKey,
            data.map((row) => (row.id === draft.id ? { ...row, ...draft } : row)),
          );
        }
      }

      return { prevAll, prevLinkedEntries };
    },
    onError: (_err, _draft, ctx) => {
      // rollback
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.allApplications, ctx.prevAll);
      if (ctx.prevLinkedEntries) {
        for (const [key, data] of ctx.prevLinkedEntries) {
          queryClient.setQueryData(key as QueryKey, data);
        }
      }
    },
    onSettled: () => {
      // ensure server truth (background refetch)
      queryClient.invalidateQueries({ queryKey: queryKeys.allApplications });
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "processApplications",
        refetchType: "active",
      });
    },
  });

  const remove = useMutation({
    mutationFn: deleteApplication, // expects the application id
    onMutate: async (removedId: string) => {
      // 1) Pause related queries so our optimistic patch isn't overwritten mid-flight
      await queryClient.cancelQueries({ queryKey: queryKeys.allApplications });
      await queryClient.cancelQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "processApplications",
      });

      // 2) Snapshot previous state for rollback
      const prevAll = queryClient.getQueryData<ApplicationView[]>(queryKeys.allApplications);
      const prevLinkedEntries = queryClient.getQueriesData<ApplicationView[]>({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "processApplications",
      });

      // 3) Optimistically remove from the global list
      if (Array.isArray(prevAll)) {
        queryClient.setQueryData<ApplicationView[]>(
          queryKeys.allApplications,
          prevAll.filter((row) => row.id !== removedId),
        );
      }

      // 4) Optimistically remove from every cached linked list
      for (const [key, data] of prevLinkedEntries) {
        if (Array.isArray(data)) {
          queryClient.setQueryData<ApplicationView[]>(
            key,
            data.filter((row) => row.id !== removedId),
          );
        }
      }

      return { prevAll, prevLinkedEntries };
    },
    onError: (_err, _removedId, ctx) => {
      // 5) Roll back if server rejects
      if (!ctx) return;
      if (ctx.prevAll) queryClient.setQueryData(queryKeys.allApplications, ctx.prevAll);
      if (ctx.prevLinkedEntries) {
        for (const [key, data] of ctx.prevLinkedEntries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      // 6) Pull server truth in background
      queryClient.invalidateQueries({ queryKey: queryKeys.allApplications });
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "processApplications",
        refetchType: "active",
      });
    },
  });


  return { list, create, update, remove };
}

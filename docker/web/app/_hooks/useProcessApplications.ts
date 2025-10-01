//app/_hooks/useProcessApplications.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { listApplications } from "@/lib/browser/isms/applications";
import {
  listLinkedApplications,
  linkApplication,
  unlinkApplication,
} from "@/lib/browser/isms/process-applications";
import { ApplicationView } from "@/lib/browser/isms/assetTypes";

export function useProcessApplications(processId: string) {
  const queryClient = useQueryClient();

  const listAll = useQuery({
    queryKey: queryKeys.allApplications,
    queryFn: listApplications,
    staleTime: 30_000,
  });

  const listLinked = useQuery({
    queryKey: queryKeys.processApplications(processId),
    queryFn: () => listLinkedApplications(processId),
  });

  const link = useMutation({
    mutationFn: (applicationId: string) =>
      linkApplication(processId, applicationId),
    onMutate: async (applicationId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.processApplications(processId),
      });
      const prev =
        queryClient.getQueryData<ApplicationView[]>(
          queryKeys.processApplications(processId),
        ) || [];
      const app = (listAll.data || []).find((a) => a.id === applicationId);
      if (app) {
        queryClient.setQueryData<ApplicationView[]>(
          queryKeys.processApplications(processId),
          [...prev, app],
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(
          queryKeys.processApplications(processId),
          ctx.prev,
        );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.processApplications(processId),
      });
    },
  });

  const unlink = useMutation({
    mutationFn: (applicationId: string) =>
      unlinkApplication(processId, applicationId),
    onMutate: async (applicationId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.processApplications(processId),
      });
      const prev =
        queryClient.getQueryData<ApplicationView[]>(
          queryKeys.processApplications(processId),
        ) || [];
      queryClient.setQueryData<ApplicationView[]>(
        queryKeys.processApplications(processId),
        prev.filter((a) => a.id !== applicationId),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(
          queryKeys.processApplications(processId),
          ctx.prev,
        );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.processApplications(processId),
      });
    },
  });

  return { listAll, listLinked, link, unlink };
}

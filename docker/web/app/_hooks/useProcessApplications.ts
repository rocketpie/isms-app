//app/_hooks/useProcessApplications.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
  listLinkedApplications,
  linkApplication,
  unlinkApplication,
} from "@/lib/browser/isms/process-applications";
import { ApplicationView } from "@/lib/browser/isms/assetTypes";
import { useApplications } from "./useApplications";

export function useProcessApplications(processId: string) {
  const queryClient = useQueryClient();
  const applications = useApplications();

  const listLinked = useQuery({
    enabled: !!processId,
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
      const app = (applications.list.data || []).find((a) => a.id === applicationId);
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

  return {
    listAll: applications.list,
    listLinked,
    link,
    unlink,
    create: applications.create,
    update: applications.update,
    remove: applications.remove,
  };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { createApplication, listApplications } from '@/lib/browser/isms/applications';
import { listLinkedApplications, linkApplication, ProcessApplicationView, unlinkApplication } from '@/lib/browser/isms/process-applications';

export function useProcessApplications(processId: string) {
  const queryClient = useQueryClient();

  const linked = useQuery({
    queryKey: queryKeys.processApplications(processId),
    queryFn: () => listLinkedApplications(processId),
  });

  const allApps = useQuery({
    queryKey: queryKeys.allApplications,
    queryFn: listApplications,
    staleTime: 30_000,
  });

  const link = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => linkApplication(processId, applicationId),
    onMutate: async ({ applicationId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.processApplications(processId) });
      const prev = queryClient.getQueryData<ProcessApplicationView[]>(queryKeys.processApplications(processId)) || [];
      const app = (allApps.data || []).find(a => a.id === applicationId);
      if (app) {
        queryClient.setQueryData<ProcessApplicationView[]>(
          queryKeys.processApplications(processId),
          [...prev, { process_id: processId, application_id: app.id, application: app }]
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(queryKeys.processApplications(processId), ctx.prev); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processApplications(processId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allApplications });
    },
  });

  const unlink = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => unlinkApplication(processId, applicationId),
    onMutate: async ({ applicationId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.processApplications(processId) });
      const prev = queryClient.getQueryData<ProcessApplicationView[]>(queryKeys.processApplications(processId)) || [];
      queryClient.setQueryData<ProcessApplicationView[]>(
        queryKeys.processApplications(processId),
        prev.filter(x => x.application_id !== applicationId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(queryKeys.processApplications(processId), ctx.prev); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processApplications(processId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allApplications });
    },
  });

  const createAndLink = useMutation({
    mutationFn: createApplication,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processApplications(processId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allApplications });
    },
  });

  return { linked, allApps, link, unlink, createAndLink };
}

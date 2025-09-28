//app/_hooks/useApplicationSystems.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { ApplicationSystemView, linkSystem, listLinkedSystems, unlinkSystem } from '@/lib/browser/isms/application-systems';
import { createSystem, listSystems } from '@/lib/browser/isms/systems';

export function useApplicationSystems(applicationId: string) {
  const queryClient = useQueryClient();

  const linked = useQuery({
    queryKey: queryKeys.applicationSystems(applicationId),
    queryFn: () => listLinkedSystems(applicationId),
  });

  const allApps = useQuery({
    queryKey: queryKeys.allSystems,
    queryFn: listSystems,
    staleTime: 30_000,
  });

  const link = useMutation({
    mutationFn: ({ systemId }: { systemId: string }) => linkSystem(applicationId, systemId),
    onMutate: async ({ systemId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
      const prev = queryClient.getQueryData<ApplicationSystemView[]>(queryKeys.applicationSystems(applicationId)) || [];
      const system = (allApps.data || []).find(a => a.id === systemId);
      if (system) {
        queryClient.setQueryData<ApplicationSystemView[]>(
          queryKeys.applicationSystems(applicationId),
          [...prev, { application_id: applicationId, system_id: system.id, system: system }]
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(queryKeys.applicationSystems(applicationId), ctx.prev); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
    },
  });

  const unlink = useMutation({
    mutationFn: ({ systemId }: { systemId: string }) => unlinkSystem(applicationId, systemId),
    onMutate: async ({ systemId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
      const prev = queryClient.getQueryData<ApplicationSystemView[]>(queryKeys.applicationSystems(applicationId)) || [];
      queryClient.setQueryData<ApplicationSystemView[]>(
        queryKeys.applicationSystems(applicationId),
        prev.filter(x => x.system_id !== systemId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(queryKeys.applicationSystems(applicationId), ctx.prev); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
    },
  });

  const createAndLink = useMutation({
    mutationFn: createSystem,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allSystems });
    },
  });

  return { linked, allApps, link, unlink, createAndLink };
}

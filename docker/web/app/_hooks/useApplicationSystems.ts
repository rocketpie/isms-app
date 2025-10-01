//app/_hooks/useApplicationSystems.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { linkSystem, listLinkedSystems, unlinkSystem } from '@/lib/browser/isms/application-systems';
import { listSystems } from '@/lib/browser/isms/systems';
import { SystemView } from '@/lib/browser/isms/assetTypes';

export function useApplicationSystems(applicationId: string) {
  const queryClient = useQueryClient();

  const listAll = useQuery({
    queryKey: queryKeys.allSystems,
    queryFn: listSystems,
    staleTime: 30_000,
  });

  const listLinked = useQuery({
    queryKey: queryKeys.applicationSystems(applicationId),
    queryFn: () => listLinkedSystems(applicationId),
  });

  const link = useMutation({
    mutationFn: (systemId: string) => linkSystem(applicationId, systemId),
    onMutate: async (systemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
      const prev = queryClient.getQueryData<SystemView[]>(queryKeys.applicationSystems(applicationId)) || [];
      const system = (listAll.data || []).find(item => item.id === systemId);
      if (system) {
        queryClient.setQueryData<SystemView[]>(
          queryKeys.applicationSystems(applicationId),
          [...prev, system]
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.applicationSystems(applicationId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
    },
  });

  const unlink = useMutation({
    mutationFn: (systemId: string) => unlinkSystem(applicationId, systemId),
    onMutate: async (systemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
      const prev = queryClient.getQueryData<SystemView[]>(queryKeys.applicationSystems(applicationId)) || [];
      queryClient.setQueryData<SystemView[]>(
        queryKeys.applicationSystems(applicationId),
        prev.filter(item => item.id !== systemId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.applicationSystems(applicationId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
    },
  });

  return { listAll, listLinked, link, unlink };
}

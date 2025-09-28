//app/_hooks/useApplications.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/_hooks/queryKeys';
import { ApplicationView } from '@/lib/browser/isms/assetTypes';
import { listApplications, createApplication, updateApplication, deleteApplication } from '@/lib/browser/isms/applications';

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
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ApplicationView> }) =>
      updateApplication(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allApplications });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allApplications });
    },
  });

  return { list, create, update, remove };
}

//app/_hooks/useSystems.ts
 
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listSystems, createSystem, updateSystem, deleteSystem, SystemView } from '@/lib/browser/isms/systems';
import { queryKeys } from './queryKeys';

export function useSystems() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: queryKeys.allSystems, queryFn: listSystems });

  const create = useMutation({
    mutationFn: createSystem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allSystems }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SystemView> }) => updateSystem(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.allSystems });
      const previous = queryClient.getQueryData<SystemView[]>(queryKeys.allSystems);
      if (previous) {
        queryClient.setQueryData<SystemView[]>(
          queryKeys.allSystems,
          previous.map(p => (p.id === id ? { ...p, ...patch } : p))
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(queryKeys.allSystems, ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.allSystems }),
  });

  const remove = useMutation({
    mutationFn: deleteSystem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allSystems }),
  });

  return { list, create, update, remove };
}

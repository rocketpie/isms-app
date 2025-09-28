//app/_hooks/useProcesses.ts
 
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listProcesses, createProcess, updateProcess, deleteProcess, ProcessView } from '@/lib/browser/isms/processes';
import { queryKeys } from './queryKeys';

export function useProcesses() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: queryKeys.allProcesses, queryFn: listProcesses });

  const create = useMutation({
    mutationFn: createProcess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allProcesses }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProcessView> }) => updateProcess(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.allProcesses });
      const previous = queryClient.getQueryData<ProcessView[]>(queryKeys.allProcesses);
      if (previous) {
        queryClient.setQueryData<ProcessView[]>(
          queryKeys.allProcesses,
          previous.map(p => (p.id === id ? { ...p, ...patch } : p))
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(queryKeys.allProcesses, ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.allProcesses }),
  });

  const remove = useMutation({
    mutationFn: deleteProcess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allProcesses }),
  });

  return { list, create, update, remove };
}

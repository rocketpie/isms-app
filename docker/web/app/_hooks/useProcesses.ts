import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listProcesses, createProcess, updateProcess, deleteProcess, ProcessView } from '@/lib/browser/isms/processes';
import { queryKeys } from './queryKeys';

export function useProcesses() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: queryKeys.processes, queryFn: listProcesses });

  const create = useMutation({
    mutationFn: createProcess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.processes }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProcessView> }) => updateProcess(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.processes });
      const previous = queryClient.getQueryData<ProcessView[]>(queryKeys.processes);
      if (previous) {
        queryClient.setQueryData<ProcessView[]>(
          queryKeys.processes,
          previous.map(p => (p.id === id ? { ...p, ...patch } : p))
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(queryKeys.processes, ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.processes }),
  });

  const remove = useMutation({
    mutationFn: deleteProcess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.processes }),
  });

  return { list, create, update, remove };
}

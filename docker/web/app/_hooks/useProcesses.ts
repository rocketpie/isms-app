//app/_hooks/useProcesses.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { listProcesses, createProcess, updateProcess, deleteProcess } from '@/lib/browser/isms/processes';

export function useProcesses() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.allProcesses,
    queryFn: listProcesses,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: createProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allProcesses });
    },
  });
  
  const update = useMutation({
    mutationFn: updateProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allProcesses });
    },
  });

  const remove = useMutation({
    mutationFn: deleteProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allProcesses });
    },
  });

  return { list, create, update, remove };
}

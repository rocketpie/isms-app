import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { ConnectionView } from '@/lib/browser/isms/assetTypes';
import {
  listConnections,
  createConnection,
  updateConnection,
  deleteConnection,
} from '@/lib/browser/isms/connections';

export function useConnections() {
  const queryClient = useQueryClient();

  // List
  const list = useQuery({
    queryKey: queryKeys.allConnections,
    queryFn: listConnections,
  });

  // Create
  const create = useMutation({
    mutationFn: createConnection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allConnections }),
  });

  // Update (optimistic)
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ConnectionView> }) =>
      updateConnection(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.allConnections });
      const previous = queryClient.getQueryData<ConnectionView[]>(queryKeys.allConnections);

      if (previous) {
        queryClient.setQueryData<ConnectionView[]>(
          queryKeys.allConnections,
          previous.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        );
      }

      return { previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.allConnections, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allConnections });
    },
  });

  // Delete
  const remove = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allConnections }),
  });

  return { list, create, update, remove };
}

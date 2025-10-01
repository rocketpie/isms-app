import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
  listConnections,
  createConnection,
  updateConnection,
  deleteConnection,
} from "@/lib/browser/isms/connections";

export function useConnections() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.allConnections,
    queryFn: listConnections,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: createConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allConnections });
    },
  });

  const update = useMutation({
    mutationFn: updateConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allConnections });
    },
  });

  const remove = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allConnections });
    },
  });

  return { list, create, update, remove };
}

//app/_hooks/useSystems.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
  listSystems,
  createSystem,
  updateSystem,
  deleteSystem,
} from "@/lib/browser/isms/systems";

export function useSystems() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.allSystems,
    queryFn: listSystems,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: createSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allSystems });
    },
  });

  const update = useMutation({
    mutationFn: updateSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allSystems });
    },
  });

  const remove = useMutation({
    mutationFn: deleteSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allSystems });
    },
  });

  return { list, create, update, remove };
}

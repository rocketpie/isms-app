import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/lib/browser/isms/locations";

export function useLocations() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.allLocations,
    queryFn: listLocations,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allLocations });
    },
  });

  const update = useMutation({
    mutationFn: updateLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allLocations });
    },
  });

  const remove = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allLocations });
    },
  });

  return { list, create, update, remove };
}

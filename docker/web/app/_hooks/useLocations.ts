import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { LocationView } from '@/lib/browser/isms/assetTypes';
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '@/lib/browser/isms/locations';

export function useLocations() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.allLocations,
    queryFn: listLocations,
  });

  const create = useMutation({
    mutationFn: createLocation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allLocations }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<LocationView> }) =>
      updateLocation(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.allLocations });
      const previous = queryClient.getQueryData<LocationView[]>(queryKeys.allLocations);

      if (previous) {
        queryClient.setQueryData<LocationView[]>(
          queryKeys.allLocations,
          previous.map((loc) => (loc.id === id ? { ...loc, ...patch } : loc)),
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.allLocations, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.allLocations }),
  });

  const remove = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allLocations }),
  });

  return { list, create, update, remove };
}

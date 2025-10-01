import { ConnectionView } from "@/lib/browser/isms/assetTypes";
import { listConnections } from "@/lib/browser/isms/connections";
import {
  listLinkedConnections,
  linkConnection,
  unlinkConnection,
} from "@/lib/browser/isms/location-connections";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export function useLocationConnections(locationId: string) {
  const queryClient = useQueryClient();

  const listAll = useQuery({
    queryKey: queryKeys.allConnections,
    queryFn: listConnections,
    staleTime: 30_000,
  });

  const listLinked = useQuery({
    queryKey: queryKeys.locationConnections(locationId),
    queryFn: () => listLinkedConnections(locationId),
  });

  const link = useMutation({
    mutationFn: (connectionId: string) =>
      linkConnection(locationId, connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.locationConnections(locationId),
      });
      const prev =
        queryClient.getQueryData<ConnectionView[]>(
          queryKeys.locationConnections(locationId),
        ) || [];
      const conn = (listAll.data || []).find((c) => c.id === connectionId);
      if (conn) {
        queryClient.setQueryData<ConnectionView[]>(
          queryKeys.locationConnections(locationId),
          [...prev, conn],
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(
          queryKeys.locationConnections(locationId),
          ctx.prev,
        );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.locationConnections(locationId),
      });
    },
  });

  const unlink = useMutation({
    mutationFn: (connectionId: string) =>
      unlinkConnection(locationId, connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.locationConnections(locationId),
      });
      const prev =
        queryClient.getQueryData<ConnectionView[]>(
          queryKeys.locationConnections(locationId),
        ) || [];
      queryClient.setQueryData<ConnectionView[]>(
        queryKeys.locationConnections(locationId),
        prev.filter((c) => c.id !== connectionId),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(
          queryKeys.locationConnections(locationId),
          ctx.prev,
        );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.locationConnections(locationId),
      });
    },
  });

  return { listAll, listLinked, link, unlink };
}

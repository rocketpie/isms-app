import { LocationView } from "@/lib/browser/isms/assetTypes";
import { listLocations } from "@/lib/browser/isms/locations";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { linkLocation, listLinkedLocations, unlinkLocation } from "@/lib/browser/isms/connection-locations";

export function useConnectionLocations(connectionId: string) {
    const queryClient = useQueryClient();

    const listAll = useQuery({
        queryKey: queryKeys.allLocations,
        queryFn: listLocations,
        staleTime: 30_000,
    });

    const listLinked = useQuery({
        queryKey: queryKeys.connectionLocations(connectionId),
        queryFn: () => listLinkedLocations(connectionId),
    });

    const link = useMutation({
        mutationFn: (locationId: string) => linkLocation(connectionId, locationId),
        onMutate: async (locationId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.connectionLocations(connectionId) });
            const prev = queryClient.getQueryData<LocationView[]>(queryKeys.connectionLocations(connectionId)) || [];
            const loc = (listAll.data || []).find(l => l.id === locationId);
            if (loc) {
                queryClient.setQueryData<LocationView[]>(
                    queryKeys.connectionLocations(connectionId),
                    [...prev, loc]
                );
            }
            return { prev };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(queryKeys.connectionLocations(connectionId), ctx.prev);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.connectionLocations(connectionId) });
        },
    });

    const unlink = useMutation({
        mutationFn: (locationId: string) => unlinkLocation(connectionId, locationId),
        onMutate: async (locationId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.connectionLocations(connectionId) });
            const prev = queryClient.getQueryData<LocationView[]>(queryKeys.connectionLocations(connectionId)) || [];
            queryClient.setQueryData<LocationView[]>(
                queryKeys.connectionLocations(connectionId),
                prev.filter(l => l.id !== locationId)
            );
            return { prev };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(queryKeys.connectionLocations(connectionId), ctx.prev);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.connectionLocations(connectionId) });
        },
    });

    return { listAll, listLinked, link, unlink };
}

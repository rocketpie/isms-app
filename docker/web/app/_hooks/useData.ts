import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { DataAssetView } from '@/lib/browser/isms/assetTypes';
import {
    listData,
    createData,
    updateData,
    deleteData,
} from '@/lib/browser/isms/dataAssets';

export function useData() {
    const queryClient = useQueryClient();

    const list = useQuery({
        queryKey: queryKeys.allData,
        queryFn: listData,
    });

    const create = useMutation({
        mutationFn: createData,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allData }),
    });

    const update = useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: Partial<DataAssetView> }) =>
            updateData(id, patch),
        onMutate: async ({ id, patch }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.allData });
            const previous = queryClient.getQueryData<DataAssetView[]>(queryKeys.allData);

            if (previous) {
                queryClient.setQueryData<DataAssetView[]>(
                    queryKeys.allData,
                    previous.map((d) => (d.id === id ? { ...d, ...patch } : d)),
                );
            }
            return { previous };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(queryKeys.allData, ctx.previous);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.allData }),
    });

    const remove = useMutation({
        mutationFn: deleteData,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allData }),
    });

    return { list, create, update, remove };
}

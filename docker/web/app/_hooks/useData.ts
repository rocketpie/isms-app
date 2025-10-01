import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import {    listData,    createData,    updateData,    deleteData,} from '@/lib/browser/isms/dataAssets';

export function useData() {
    const queryClient = useQueryClient();

    const list = useQuery({
        queryKey: queryKeys.allData,
        queryFn: listData,
        staleTime: 30_000,
    });

    const create = useMutation({
        mutationFn: createData,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.allData });
        },
    });

    const update = useMutation({
        mutationFn: updateData,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.allData });
        },
    });

    const remove = useMutation({
        mutationFn: deleteData,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.allData });
        },
    });

    return { list, create, update, remove };
}

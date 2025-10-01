
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { linkData, listLinkedData, unlinkData } from '@/lib/browser/isms/system-data';
import { DataAssetView } from '@/lib/browser/isms/assetTypes';
import { listData } from '@/lib/browser/isms/dataAssets';

export function useSystemData(systemId: string) {
  const queryClient = useQueryClient();

  const listAll = useQuery({
    queryKey: queryKeys.allData,
    queryFn: listData,
    staleTime: 30_000,
  });

  const listLinked = useQuery({
    queryKey: queryKeys.systemData(systemId),
    queryFn: () => listLinkedData(systemId),
  });

  const link = useMutation({
    mutationFn: (dataId: string) => linkData(systemId, dataId),
    onMutate: async (dataId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.systemData(systemId) });
      const prev = queryClient.getQueryData<DataAssetView[]>(queryKeys.systemData(systemId)) || [];
      const dat = (listAll.data || []).find(d => d.id === dataId);
      if (dat) {
        queryClient.setQueryData<DataAssetView[]>(
          queryKeys.systemData(systemId),
          [...prev, dat]
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.systemData(systemId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemData(systemId) });
    },
  });

  const unlink = useMutation({
    mutationFn: (dataId: string) => unlinkData(systemId, dataId),
    onMutate: async (dataId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.systemData(systemId) });
      const prev = queryClient.getQueryData<DataAssetView[]>(queryKeys.systemData(systemId)) || [];
      queryClient.setQueryData<DataAssetView[]>(
        queryKeys.systemData(systemId),
        prev.filter(d => d.id !== dataId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.systemData(systemId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemData(systemId) });
    },
  });

  return { listAll, listLinked, link, unlink };
}

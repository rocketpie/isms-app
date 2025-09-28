//app/applications/components/LinkedSystemsSection.tsx
'use client'

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/_hooks/queryKeys';
import { listLinkedSystems } from '@/lib/browser/isms/application-systems';

export function LinkedSystemsSection({ applicationId }: { applicationId: string }) {
  const q = useQuery({
    // Keep this under the app list key so invalidations refresh linked sections too
    queryKey: [...queryKeys.allApplications, applicationId, 'systems'],
    queryFn: () => listLinkedSystems(applicationId),
  });

  if (q.isLoading) return <p className="text-sm">Loading linked systems…</p>;
  if (q.error) return <p className="text-sm text-red-600">{(q.error as Error).message}</p>;
  if (!q.data?.length) return <p className="text-sm text-neutral-600">No linked systems.</p>;

  return (
    <div className="grid gap-2">
      <h3 className="font-medium">Linked Systems</h3>
      <ul className="grid gap-1">
        {q.data.map(link => (
          <li key={link.system_id} className="text-sm">
            {link.system?.name ?? '(missing)'}{' '}
            <span className="text-neutral-500">({link.system?.owner?.name ?? '—'})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

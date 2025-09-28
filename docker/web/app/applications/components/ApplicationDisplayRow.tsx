//app/applications/components/ApplicationDisplayRow.tsx
'use client'

import { ApplicationView } from '@/lib/browser/isms/applications';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';

export function ApplicationDisplayRow(props: {
  listItem: ApplicationView;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { listItem, expanded, onToggle, onEdit } = props;
  return (
    <div className="grid gap-1 grid-cols-1 md:grid-cols-[1fr,2fr,1fr,auto] md:items-center">

      <button
        className="text-lg text-neutral-500 hover:text-black"
        onClick={onToggle}
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {listItem.name}
      </button>

      <div className="text-sm text-neutral-700">
        {listItem.description ? (
          <span className="text-neutral-600">{listItem.description}</span>
        ) : (
          <span className="text-neutral-400">No description</span>
        )}
      </div>

      <div className="text-sm text-neutral-700">
        Owner: <span className="text-neutral-600">{listItem.owner?.name}</span>
      </div>

      <div className="flex gap-2">
        <button className="rounded-xl px-3 py-2 border bg-white" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
    </div>
  );
}

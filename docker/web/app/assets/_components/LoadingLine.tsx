
'use client';

export default function LoadingLine({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-neutral-600 text-sm">
      <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent" />
      <span>{label ?? 'Loading…'}</span>
    </div>
  );
}

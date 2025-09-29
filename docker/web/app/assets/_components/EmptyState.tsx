
'use client';

export default function EmptyState({ label }: { label?: string }) {
    return (
        <p className="text-neutral-500 text-sm italic">
            {label ?? 'No items found.'}
        </p>
    );
}

'use client';
import { listOwnerships } from '@/lib/browser/isms/ownership';
import { useQuery } from '@tanstack/react-query';

export function OwnerSelect(props: {
    value: string | '';
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const ownersQuery = useQuery({ queryKey: ['ownership'], queryFn: listOwnerships });
    return (
        <select className={props.className} value={props.value} onChange={e => props.onChange(e.target.value)}>
            <option value="">{props.placeholder ?? 'Owner (optional)'}</option>
            {(ownersQuery.data || []).map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
            ))}
        </select>
    );
}

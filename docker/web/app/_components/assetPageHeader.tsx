//app/_components/assetPageHeader.tsx
'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // if you have a cn helper; otherwise inline class logic
import { ChevronRight } from 'lucide-react';

const items = [
    { label: 'Processes', href: '/assets/processes' },
    { label: 'Applications', href: '/assets/applications' },
    { label: 'Systems', href: '/assets/systems' },
    { label: 'Locations', href: '/assets/locations' },
    { label: 'Connections', href: '/assets/connections' },
];

export default function AssetPageHeader() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-3 py-2">
            {items.map((item, idx) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                    <div key={item.href} className="flex items-center">
                        <Link
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                'text-xl',
                                isActive ? 'text-black font-semibold' : 'text-neutral-400 hover:text-neutral-600'
                            )}
                        >
                            {item.label}
                        </Link>
                        {idx < items.length - 1 && (
                            <span className="mx-3 text-neutral-300 select-none"><ChevronRight /></span>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

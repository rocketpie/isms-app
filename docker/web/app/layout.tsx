// web/app/layout.tsx
import './globals.css'
import Providers from './providers'
import Link from 'next/link'
import WhoAmI from './_components/whoami'
import { supabase } from '@/lib/supabase'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50">
        <Providers>
          <header className="w-full border-b bg-white">
            <div className="mx-auto max-w-5xl flex items-center justify-between p-3">
              <div className="flex items-center gap-4">
                <Link href="/" className="font-semibold">ISMS-App</Link>
                <Link href="/applications" className="text-sm text-neutral-600 hover:text-black">Applications</Link>
              </div>
              <div className="flex items-center gap-3">
                <WhoAmI />
                <AuthButtons />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-5xl p-4">{children}</main>
        </Providers>
      </body>
    </html>
  )
}

function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      {/* Client component boundary */}
      {/* @ts-expect-error Async Server Component wrapper */}
      <ClientAuthButtons />
    </div>
  )
}

// Inline a tiny client wrapper
function ClientAuthButtons() {
  // Mark as client
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const Comp = require('./login/_client-auth-buttons').default
  return <Comp />
}

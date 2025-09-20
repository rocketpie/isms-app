'use client'

import { ReactNode, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { auth } from '@/lib/auth'

let client: QueryClient | null = null
function getClient() {
  if (!client) client = new QueryClient()
  return client
}

export default function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    // hydrate auth state changes => refetch queries on sign-in/out
    const { data: sub } = auth.onAuthStateChange(() => {
      getClient().invalidateQueries()
    })
    setReady(true)
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) return null
  return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>
}

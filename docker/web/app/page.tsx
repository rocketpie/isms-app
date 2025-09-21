// web/app/page.tsx
import { fetchWithTimeout } from '@/lib/fetch-timeout'
import { getPostgrestUrl } from '@/lib/config'

export const dynamic = 'force-dynamic'

async function fetchApiRoot() {
  const url = getPostgrestUrl()        // absolute URL (server can reach it)
  new URL(url)                         // validate early for clearer errors
  const res = await fetchWithTimeout(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`PostgREST not reachable (${res.status})`)
  return res.json()
}

export default async function Home() {
  const openapi = await fetchApiRoot()
  return (
    <main style={{ padding: 24 }}>
      <h1>ISMS-App</h1>
      <p>Same-origin proxy is active.</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify({ title: openapi.info?.title, version: openapi.info?.version }, null, 2)}
      </pre>
      <p>Auth endpoint is proxied at <code>/auth</code> (e.g. <code>/auth/signup</code>).</p>
    </main>
  )
}

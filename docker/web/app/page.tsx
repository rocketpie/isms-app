// web/app/page.tsx
import { fetchWithTimeout } from '@/lib/fetch-timeout'
import { getApiUrl } from '@/lib/config'
import { getAuthUrl } from '@/lib/config'


export const dynamic = 'force-dynamic'

async function fetchApiRoot() {
  const url = getApiUrl()
  const response = await fetchWithTimeout(`${url}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`PostgREST not reachable (${response.status})`)
  return response.json()
}

async function fetchAuthSettings() {
  const url = getAuthUrl()
  const response = await fetchWithTimeout(`${url}/settings`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`GoTrue not reachable (${response.status})`)
  return response.json()
}

export default async function Home() {
  const openapi = await fetchApiRoot()
  const authSettings = await fetchAuthSettings()
  return (
    <main style={{ padding: 24 }}>
      <h1>ISMS-App</h1>
      <p>API:</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify({ title: openapi.info?.title, version: openapi.info?.version }, null, 2)}
      </pre>

      <p>AUTH:</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify({ title: 'email login', enabled: authSettings.external?.email }, null, 2)}
      </pre>
    </main>
  )
}

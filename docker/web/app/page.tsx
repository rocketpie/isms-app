// web/app/page.tsx
import { headers } from "next/headers";
import { fetchWithTimeout } from '@/lib/fetch-timeout'

export const dynamic = "force-dynamic"; // optional, avoids caching surprises

export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_POSTGREST_URL // e.g. http://dockerhost1:7771
  if (!envUrl) {
    throw new Error("Missing NEXT_PUBLIC_POSTGREST_URL environment variable")
  }
  return envUrl
}

async function fetchApiRoot() {
  const url = getApiUrl();
  const res = await fetchWithTimeout(`${url}`, { cache: 'no-store' }) // relative is fine; runs server-side
  if (!res.ok) throw new Error(`PostgREST not reachable (${res.status})`)
  return res.json()
}

export default async function Home() {
  const openapi = await fetchApiRoot();
  return (
    <main style={{ padding: 24 }}>
      <h1>ISMS-App</h1>
      <p>Same-origin proxy is active.</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify({ title: openapi.info?.title, version: openapi.info?.version }, null, 2)}
      </pre>
      <p>
        Auth endpoint is proxied at <code>/auth</code> (e.g. <code>/auth/signup</code>).
      </p>
    </main>
  );
}


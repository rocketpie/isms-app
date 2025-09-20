// web/app/page.tsx
import { headers } from "next/headers";

export const dynamic = "force-dynamic"; // optional, avoids caching surprises

export function getBaseUrl(): string {
  const h = headers()
  const proto = h.get("x-forwarded-proto")
  const host  = h.get("x-forwarded-host") ?? h.get("host")

  if (proto && host) {
    return `${proto}://${host}`
  }

  const envUrl = process.env.NEXT_PUBLIC_POSTGREST_URL // e.g. http://dockerhost1:7771
  if (!envUrl) {
    throw new Error("Missing NEXT_PUBLIC_POSTGREST_URL environment variable")
  }
  return envUrl
}

// inside app/page.tsx
async function fetchApiRoot() {
  const url = getBaseUrl();
  const res = await fetch(`${url}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`PostgREST not reachable (${res.status})`)
  // PostgREST root returns OpenAPI JSON; you can just return ok:true
  return res.json();
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

// web/app/page.tsx
import { headers } from "next/headers";

export const dynamic = "force-dynamic"; // optional, avoids caching surprises

function getBaseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host  = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`;
  // Fallbacks for local/dev or custom envs
  return process.env.NEXT_PUBLIC_SITE_URL
      ?? process.env.APP_URL
      ?? "http://localhost:7770";
}

async function fetchApiRoot() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API not reachable (${res.status})`);
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

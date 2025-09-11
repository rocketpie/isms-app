// web/app/page.tsx
async function fetchApiRoot() {
  const res = await fetch('/api/', { cache: 'no-store' });
  if (!res.ok) throw new Error('API not reachable');
  return res.json();
}

export default async function Home() {
  const openapi = await fetchApiRoot();
  return (
    <main style={{ padding: 24 }}>
      <h1>ISMS-App</h1>
      <p>Same-origin proxy is active.</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify({ title: openapi.info?.title, version: openapi.info?.version }, null, 2)}
      </pre>
      <p>Auth endpoint is proxied at <code>/auth</code> (e.g. <code>/auth/signup</code>).</p>
    </main>
  );
}

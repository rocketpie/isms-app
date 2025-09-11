export default function Home() {
  const api = process.env.NEXT_PUBLIC_API_URL;
  const auth = process.env.NEXT_PUBLIC_AUTH_URL;
  const site = process.env.NEXT_PUBLIC_SITE_URL;

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>ISMS-App</h1>
      <p style={{ marginBottom: 16 }}>Minimal scaffold is running.</p>
      <div style={{ lineHeight: 1.8 }}>
        <div><strong>PostgREST API:</strong> {api}</div>
        <div><strong>Auth (GoTrue):</strong> {auth}</div>
        <div><strong>Site URL:</strong> {site}</div>
      </div>
    </main>
  );
}

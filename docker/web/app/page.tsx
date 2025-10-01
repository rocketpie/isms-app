//app/page.tsx

import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { postgrest } from "@/lib/backend/postgrest";
import { getGoTrueUrl, getPostgrestUrl } from "@/lib/backend/config";

export const dynamic = "force-dynamic";

async function fetchApiRoot() {
  return await postgrest<{ info?: { title?: string; version?: string } }>(
    "/",
    { method: "GET" },
    "app",
  );
}

async function fetchAuthSettings() {
  const authUrl = getGoTrueUrl();
  const response = await fetchWithTimeout(`${authUrl}/settings`, {
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`GoTrue not reachable (${response.status})`);
  return response.json();
}

export default async function Home() {
  const backendApiUrl = getPostgrestUrl();
  const backendAuthUrl = getGoTrueUrl();
  const openapi = await fetchApiRoot();
  const authSettings = await fetchAuthSettings();
  return (
    <main style={{ padding: 24 }}>
      <h1>ISMS-App</h1>
      <p>API ({backendApiUrl}):</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(
          { title: openapi.info?.title, version: openapi.info?.version },
          null,
          2,
        )}
      </pre>

      <p>AUTH ({backendAuthUrl}):</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(
          { title: "email login", enabled: authSettings.external?.email },
          null,
          2,
        )}
      </pre>
    </main>
  );
}

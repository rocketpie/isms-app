// web/lib/config.ts
export function getPostgrestUrl(): string {
  const url = process.env.NEXT_PUBLIC_POSTGREST_URL
  new URL(url) // validate early for clearer errors    
  if (!url) throw new Error("Missing NEXT_PUBLIC_POSTGREST_URL")
  return url
}

export function getAuthUrl(): string {
  const url = process.env.NEXT_PUBLIC_GOTRUE_URL
  new URL(url) // validate early for clearer errors   
  if (!url) throw new Error("Missing NEXT_PUBLIC_GOTRUE_URL")
  return url
}

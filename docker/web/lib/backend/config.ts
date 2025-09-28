// web/lib/backend/config.ts
export function getPostgrestUrl(): string {
    const url = process.env.INTERNAL_POSTGREST_URL || ''
    new URL(url) // validate early for clearer errors    
    if (!url) throw new Error("Missing INTERNAL_POSTGREST_URL")
    return url
}

export function getGoTrueUrl(): string {
    const url = process.env.INTERNAL_GOTRUE_URL || ''
    new URL(url) // validate early for clearer errors    
    if (!url) throw new Error("Missing INTERNAL_GOTRUE_URL")
    return url
}

export const IsDebug = process.env.DEBUG === '1'

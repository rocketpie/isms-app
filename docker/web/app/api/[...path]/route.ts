//app/api/[...path]/route.ts
import { NextRequest } from 'next/server'
import { fetchWithTimeout } from '@/lib/fetch-timeout'
import { logDebug } from '@/lib/logDebug'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const API_BASE = process.env.INTERNAL_POSTGREST_URL
if (!API_BASE) throw new Error('Missing INTERNAL_POSTGREST_URL')
new URL(API_BASE) // validate early for clearer errors   

function buildTarget(req: NextRequest) {
  // /api/<...> → <API_BASE>/<...>
  const sub = req.nextUrl.pathname.replace(/^\/api\/?/, '')
  const qs = req.nextUrl.search
  return `${API_BASE}/${sub}${qs}`
}

function forwardHeaders(h: Headers) {
  const out = new Headers()
  h.forEach((v, k) => {
    const lk = k.toLowerCase()
    if (
      ['host', 'content-length', 'content-type', 'connection', 'proxy-connection', 'transfer-encoding', 'upgrade'].includes(
        lk,
      )
    )
      return
    out.set(k, v)
  })
  return out
}

async function proxy(req: NextRequest) {
  const target = buildTarget(req)

  // Pull interesting headers (do NOT log bearer)
  const acceptProfile = req.headers.get('accept-profile')
  const contentProfile = req.headers.get('content-profile')
  const prefer = req.headers.get('prefer')
  const hasAuth = req.headers.has('authorization')

  logDebug(`[API proxy] ${req.method} → ${target} | Accept-Profile=${acceptProfile ?? '-'} Content-Profile=${contentProfile ?? '-'} Prefer=${prefer ?? '-'} Authorization=${hasAuth ? '[redacted]' : 'none'}`)
  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders(req.headers),
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: 'manual',
    cache: 'no-store',
  }

  const res = await fetchWithTimeout(target, init)
  logDebug(`[API proxy] Response ${res.status} from ${target}`)

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: new Headers(res.headers),
  })
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as OPTIONS }

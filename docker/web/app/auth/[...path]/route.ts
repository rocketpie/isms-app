import { NextRequest } from 'next/server'
import { fetchWithTimeout } from '@/lib/fetch-timeout' // 15s cap (ADR-002)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const AUTH_BASE = process.env.INTERNAL_GOTRUE_URL
if (!AUTH_BASE) throw new Error('Missing INTERNAL_GOTRUE_URL')
new URL(AUTH_BASE) // validate early for clearer errors   

function buildTarget(req: NextRequest) {
  // /auth/<...> → <AUTH_BASE>/<...>
  const sub = req.nextUrl.pathname.replace(/^\/auth\/?/, '')
  const qs = req.nextUrl.search // includes leading '?', or ''
  return `${AUTH_BASE}/${sub}${qs}`
}

// strip hop-by-hop / problematic headers; keep auth & content headers, etc.
function forwardHeaders(h: Headers) {
  const out = new Headers()
  h.forEach((v, k) => {
    const lk = k.toLowerCase()
    if (
      ['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'host', 'content-length'].includes(
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

  // Minimal but useful: show content-type and whether we passed auth
  const contentType = req.headers.get('content-type')
  const hasAuth = req.headers.has('authorization')

  console.debug(
    `[AUTH proxy] ${req.method} → ${target} | ` +
      `Content-Type=${contentType ?? '-'} ` +
      `Authorization=${hasAuth ? '[redacted]' : 'none'}`
  )

  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders(req.headers),
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: 'manual',
    cache: 'no-store',
  }

  const res = await fetchWithTimeout(target, init)
  console.debug(`[AUTH proxy] Response ${res.status} from ${target}`)

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: new Headers(res.headers),
  })
}


export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as OPTIONS }

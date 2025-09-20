'use client'
import { useEffect, useState } from 'react'
import { pgrst } from '@/lib/api'

export default function WhoAmI() {
  const [txt, setTxt] = useState('anonymous')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // If app.whoami exists:
        const who = await pgrst<{ email?: string; role?: string }[]>('/rpc/whoami', {
          method: 'POST',
          body: '{}'
        }).catch(() => null)

        if (!alive) return
        if (who && who[0]?.email) {
          setTxt(`${who[0].email} (${who[0].role ?? 'authenticated'})`)
        } else {
          // Fallback: decode role-like info from a trivial endpoint
          const me = await pgrst<{ now: string }>('/')
          setTxt('authenticated')
        }
      } catch {
        setTxt('anonymous')
      }
    })()
    return () => { alive = false }
  }, [])

  return <span className="text-sm text-neutral-600">You: {txt}</span>
}

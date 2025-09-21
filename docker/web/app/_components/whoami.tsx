'use client'
import { useEffect, useState } from 'react'
import { postgrest } from '@/lib/api'

export default function WhoAmI() {
  const [txt, setTxt] = useState('anonymous')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const who = await postgrest<{ email?: string; role?: string }>('/rpc/whoami', { method: 'POST' }, 'app');
        
        if (!alive) return
        if (who && who[0]?.email) {
          setTxt(`${who[0].email} (${who[0].role ?? 'authenticated'})`)
        } 
      } catch {
        setTxt('anonymous')
      }
    })()
    return () => { alive = false }
  }, [])

  return <span className="text-sm text-neutral-600">You: {txt}</span>
}

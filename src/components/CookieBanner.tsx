'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CookieBanner() {
  const [show, setShow] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setShow(true)
  }, [])

  if (!show) return null

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setShow(false)
    // Soft refresh to activate analytics without full page reload
    router.refresh()
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border p-4 animate-modal-in">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        <p className="text-xs text-muted flex-1 text-center sm:text-left">
          Usiamo solo cookie tecnici essenziali e, con il tuo consenso, cookie analitici anonimi.
          Nessun dato personale.{' '}
          <a href="/privacy" className="underline hover:text-text">Privacy</a>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="text-xs text-muted hover:text-text px-4 py-2 rounded-full border border-border transition-colors"
          >
            Solo necessari
          </button>
          <button
            onClick={accept}
            className="text-xs bg-accent hover:bg-[#FF5C7A] text-white px-4 py-2 rounded-full font-bold transition-colors"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  )
}

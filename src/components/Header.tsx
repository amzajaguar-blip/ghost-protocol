'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SubmitModal from './SubmitModal'

export default function Header() {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const handleSubmitted = () => {
    setShowModal(false)
    router.refresh()
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl max-sm:backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div>
            <div
              className="text-lg font-black tracking-tight leading-none"
              style={{ fontFamily: 'Unbounded, sans-serif', letterSpacing: '-0.03em' }}
            >
              GHOST<span className="text-accent">.</span>
            </div>
            <p
              className="text-[10px] text-muted mt-0.5 tracking-widest uppercase"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              non sei l&apos;unico
            </p>
          </div>

          {/* Desktop CTA */}
          <button
            onClick={() => setShowModal(true)}
            aria-label="Condividi un momento anonimo"
            className="group relative bg-accent hover:bg-[#FF5C7A] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden max-sm:hidden"
            style={{ fontFamily: 'Unbounded, sans-serif', letterSpacing: '0.04em' }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s linear infinite',
              }}
            />
            <span className="relative flex items-center gap-1.5">
              <span>+</span> CONDIVIDI
            </span>
          </button>
        </div>

        {/* Mobile FAB */}
        <button
          onClick={() => setShowModal(true)}
          aria-label="Condividi un momento anonimo"
          className="sm:hidden fixed bottom-6 right-6 z-40 bg-accent hover:bg-[#FF5C7A] text-white font-black px-6 py-4 rounded-full shadow-[0_8px_32px_rgba(255,60,95,0.35)] hover:shadow-[0_12px_40px_rgba(255,60,95,0.45)] transition-all duration-200 active:scale-95 flex items-center gap-2 animate-fade-in"
          style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.75rem', letterSpacing: '0.04em' }}
        >
          <span className="text-lg leading-none">+</span> CONDIVIDI
        </button>
      </header>

      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitted}
        />
      )}
    </>
  )
}

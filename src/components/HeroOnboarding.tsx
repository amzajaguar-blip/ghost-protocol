'use client'

import { useState, useEffect, useRef } from 'react'

const ONBOARDED_KEY = 'ghost_onboarded'

export function hasOnboarded(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1'
  } catch { return true }
}

export function markOnboarded(): void {
  try { localStorage.setItem(ONBOARDED_KEY, '1') } catch { /* ignore */ }
}

interface HeroOnboardingProps {
  totalMoments?: number
  onDismiss: () => void
}

export default function HeroOnboarding({ totalMoments, onDismiss }: HeroOnboardingProps) {
  const [visible, setVisible] = useState(false)
  const [animateCard, setAnimateCard] = useState(false)
  const [yesPercent, setYesPercent] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    setVisible(true)
    // Delay card reveal for dramatic effect
    const t1 = setTimeout(() => setAnimateCard(true), 400)
    // Animate percentage
    const start = performance.now()
    const duration = 1500
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setYesPercent(Math.round(73 * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    const t2 = setTimeout(() => { rafRef.current = requestAnimationFrame(tick) }, 1000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const scrollToFeed = () => {
    markOnboarded()
    onDismiss()
    setTimeout(() => {
      document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  if (!visible) return null

  return (
    <section className="min-h-dvh flex flex-col items-center justify-center px-4 py-16 text-center animate-fade-in">
      {/* Logo */}
      <div
        className="text-[1.6rem] font-black tracking-tight leading-none mb-2"
        style={{ fontFamily: 'Unbounded, sans-serif', letterSpacing: '-0.03em' }}
      >
        GHOST<span className="text-accent">.</span>
      </div>
      <p
        className="text-[10px] text-muted mb-12 tracking-widest uppercase"
        style={{ fontFamily: 'DM Mono, monospace' }}
      >
        non sei l&apos;unico
      </p>

      {/* Headline */}
      <h1
        className="font-black text-text leading-[1.05] mb-5 max-w-lg"
        style={{
          fontFamily: 'Unbounded, sans-serif',
          fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
          letterSpacing: '-0.03em',
        }}
      >
        NON SEI<br />L&apos;UNICO<span className="text-accent">.</span>
      </h1>

      <p className="text-muted text-sm leading-relaxed max-w-md mb-10">
        Un posto anonimo dove scoprire in percentuale quante persone hanno vissuto la tua stessa
        esperienza. Zero dati. Zero account. Zero tracce.
      </p>

      {/* Example moment card */}
      <div
        className={`w-full max-w-md border border-border bg-surface/50 rounded-2xl p-5 mb-8 text-left transition-all duration-700 ${
          animateCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <p className="text-[10px] text-muted uppercase tracking-widest mb-3" style={{ fontFamily: 'DM Mono, monospace' }}>
          10m fa
        </p>
        <blockquote className="text-[0.95rem] leading-relaxed text-text font-medium mb-5">
          &ldquo;Ho pianto al lavoro oggi e nessuno se n&apos;è accorto.&rdquo;
        </blockquote>

        <div className="flex items-end gap-3 mb-4">
          <span
            className="leading-none font-black"
            style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '3rem', color: '#FFD60A' }}
          >
            {yesPercent}%
          </span>
          <span className="text-muted text-xs mb-1">ha vissuto questo</span>
        </div>

        <div className="h-1 bg-border rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${yesPercent}%`,
              background: 'linear-gradient(90deg, #4ADE80 0%, #22D3EE 100%)',
            }}
          />
        </div>

        <p className="text-xs text-muted" style={{ fontFamily: 'DM Mono, monospace' }}>
          <span className="text-vote-yes">847 sì</span> ·{' '}
          <span className="text-vote-no">313 no</span> ·{' '}
          1.160 voti
        </p>

        <p className="text-xs text-muted mt-3 pt-3 border-t border-border/50">
          🌍 Quasi tutti ci sono passati. Non sei assolutamente solo.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={scrollToFeed}
          className="flex-1 bg-accent hover:bg-[#FF5C7A] text-white font-black py-4 px-6 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.78rem', letterSpacing: '0.04em' }}
        >
          VOTA UN MOMENTO ↓
        </button>
        <button
          onClick={() => { markOnboarded(); onDismiss() }}
          className="flex-1 border border-border hover:border-accent/30 text-muted hover:text-text py-4 px-6 rounded-full transition-all duration-200"
          style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.72rem', letterSpacing: '0.04em' }}
        >
          + CONDIVIDI IL TUO
        </button>
      </div>

      {/* Social proof */}
      {totalMoments && totalMoments > 0 && (
        <p className="text-muted text-xs mt-8" style={{ fontFamily: 'DM Mono, monospace' }}>
          👻 <strong className="text-text">{totalMoments}</strong> momenti già condivisi
        </p>
      )}

      {/* Trust strip */}
      <div className="flex gap-8 mt-12 text-center">
        {[
          { icon: '👻', label: '100% anonimo', sub: 'Nessun dato' },
          { icon: '🔒', label: 'Zero account', sub: 'Mai registrarsi' },
          { icon: '⚡', label: 'In 10 secondi', sub: 'Condividi subito' },
        ].map(item => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <span className="text-xl">{item.icon}</span>
            <span className="text-[11px] text-text font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }}>{item.label}</span>
            <span className="text-[9px] text-muted">{item.sub}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

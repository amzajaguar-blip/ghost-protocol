'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import type { Moment } from '@/lib/supabase'
import { getFingerprint, hasVoted, markVoted } from '@/lib/fingerprint'

// ── Helpers ──────────────────────────────────────────────

const TIME_AGO_CACHE = new Map<string, string>()
let lastCacheClean = Date.now()

function timeAgo(iso: string): string {
  // Clean cache periodically
  if (Date.now() - lastCacheClean > 60_000) {
    TIME_AGO_CACHE.clear()
    lastCacheClean = Date.now()
  }

  const cached = TIME_AGO_CACHE.get(iso)
  if (cached) return cached

  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  let result: string
  if (diff < 60)     result = 'ora'
  else if (diff < 3600)   result = `${Math.floor(diff / 60)}m fa`
  else if (diff < 86400)  result = `${Math.floor(diff / 3600)}h fa`
  else if (diff < 604800) result = `${Math.floor(diff / 86400)}g fa`
  else result = new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

  TIME_AGO_CACHE.set(iso, result)
  return result
}

// Animated counter: counts from 0 to target
function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  const raf = useRef<number>(0)
  const startRef = useRef(0)

  useEffect(() => {
    setVal(0) // Reset on target change
    startRef.current = performance.now()
    const duration = 900

    const tick = (now: number) => {
      const t = Math.min((now - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(target * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target])

  return <>{val}</>
}

// ── Component ─────────────────────────────────────────────

interface MomentCardProps {
  moment: Moment
  animationDelay?: number
}

export default function MomentCard({ moment, animationDelay = 0 }: MomentCardProps) {
  const [yesCount, setYesCount] = useState(moment.yes_count)
  const [noCount,  setNoCount]  = useState(moment.no_count)
  const [voted,    setVoted]    = useState(false)
  const [myVote,   setMyVote]   = useState<boolean | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [showToast, setShowToast] = useState(false)

  const total      = yesCount + noCount
  const yesPercent = total > 0 ? Math.round((yesCount / total) * 100) : 0

  // Check localStorage on mount
  useEffect(() => {
    if (hasVoted(moment.id)) {
      setVoted(true)
      setRevealed(true)
    }
  }, [moment.id])

  const handleVote = async (vote: boolean) => {
    if (voted || loading) return
    setLoading(true)

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-anti-csrf': '1',
        },
        body: JSON.stringify({
          moment_id: moment.id,
          vote,
          fingerprint: getFingerprint(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('Vote failed:', data.error)
        return
      }

      if (data.yes_count !== undefined) {
        setYesCount(data.yes_count)
        setNoCount(data.no_count)
      }

      // If the vote was a duplicate (alreadyVoted), use the previous vote
      // so the UI correctly reflects what the user actually voted
      markVoted(moment.id)
      setMyVote(data.alreadyVoted && data.previousVote !== undefined ? data.previousVote : vote)
      setVoted(true)
      setTimeout(() => setRevealed(true), 80)
    } catch (err) {
      console.error('Vote error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const msg = `"${moment.text}"\n\nIl ${yesPercent}% delle persone l'ha vissuto.\n👻 ghost-protocol.app`
    try {
      if (navigator.share) {
        await navigator.share({ text: msg })
      } else {
        await navigator.clipboard.writeText(msg)
        setCopied(true)
        setShowToast(true)
        setTimeout(() => { setCopied(false); setShowToast(false) }, 2000)
      }
    } catch {
      // user cancelled share
    }
  }

  // Vote prompt copy with social urgency
  const votePrompt = useCallback(() => {
    if (total === 0) return '✨ Nessuno ha ancora votato. Sei il primo a scoprirlo.'
    if (total > 50) return `👥 Oltre ${total} persone hanno votato. Scopri se sei in compagnia.`
    if (total > 10) return `🔥 ${total} persone hanno già votato. Scopri se sei in compagnia.`
    if (total === 1) return '1 persona ha già votato — vota per scoprire il %'
    return `${total} persone hanno già votato — vota per scoprire il %`
  }, [total])

  return (
    <article
      className="card-glow border border-border bg-surface rounded-2xl overflow-hidden opacity-0 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Optional image */}
      {moment.image_url && (
        <div className="relative w-full h-52">
          <Image
            src={moment.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />
        </div>
      )}

      <div className="p-6">
        {/* Timestamp */}
        <p
          className="text-[10px] text-muted uppercase tracking-widest mb-4"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          {timeAgo(moment.created_at)}
        </p>

        {/* Moment text */}
        <blockquote className="text-[1.05rem] leading-relaxed text-text font-medium mb-6">
          &ldquo;{moment.text}&rdquo;
        </blockquote>

        {/* ─── VOTED STATE: result reveal ─────────────────── */}
        {voted && revealed ? (
          <div className="animate-reveal">
            {/* Big % */}
            <div className="flex items-end gap-3 mb-4">
              <span
                className="leading-none font-black"
                style={{
                  fontFamily: 'Unbounded, sans-serif',
                  fontSize: 'clamp(3rem, 12vw, 4rem)',
                  color: '#FFD60A',
                  lineHeight: 1,
                }}
                aria-live="polite"
              >
                <AnimatedCounter target={yesPercent} />%
              </span>
              <span className="text-muted text-sm mb-1 leading-tight">
                ha vissuto<br />questo
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-border rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full vote-bar"
                style={{
                  width: `${yesPercent}%`,
                  background:
                    yesPercent >= 50
                      ? 'linear-gradient(90deg, #4ADE80 0%, #22D3EE 100%)'
                      : 'linear-gradient(90deg, #FF3C5F 0%, #FF8C42 100%)',
                }}
              />
            </div>

            {/* Stats + share */}
            <div className="flex items-center justify-between gap-2">
              <p
                className="text-xs text-muted flex items-center gap-2"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                <span className="text-vote-yes">{yesCount} sì</span>
                <span>·</span>
                <span className="text-vote-no">{noCount} no</span>
                <span>·</span>
                <span>{total} voti</span>
              </p>

              <div className="flex items-center gap-2">
                {myVote !== null && (
                  <span
                    className="text-[10px] text-muted"
                    style={{ fontFamily: 'DM Mono, monospace' }}
                  >
                    tu:{' '}
                    <span className={myVote ? 'text-vote-yes' : 'text-vote-no'}>
                      {myVote ? 'anche io' : 'solo io'}
                    </span>
                  </span>
                )}
                <button
                  onClick={handleShare}
                  aria-label="Condividi questo momento"
                  className="text-[10px] text-muted hover:text-accent border border-border hover:border-accent/40 px-2.5 py-1 rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {copied ? '✓ copiato' : '↗ condividi'}
                </button>
              </div>
            </div>

            {/* Context message */}
            {total >= 5 && (
              <p className="text-xs text-muted mt-3 pt-3 border-t border-border/50">
                {yesPercent >= 80
                  ? '🌍 Quasi tutti ci sono passati. Non sei assolutamente solo.'
                  : yesPercent >= 50
                  ? '💭 La maggioranza capisce cosa si prova.'
                  : yesPercent >= 30
                  ? '🤍 Non sei il solo — ma sei in minoranza coraggiosa.'
                  : '⚡ Raro ma reale. Grazie per averlo condiviso.'}
              </p>
            )}
          </div>

        ) : (
          /* ─── NOT VOTED: show vote buttons ─────────────── */
          <div>
            <p
              className="text-[10px] text-muted uppercase tracking-widest mb-3"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              ti è mai capitato?
            </p>

            <div className="grid grid-cols-2 gap-3 max-[360px]:grid-cols-1">
              {/* YES button */}
              <button
                onClick={() => handleVote(true)}
                disabled={loading}
                aria-pressed={voted && myVote === true}
                aria-label="Anche io — ho vissuto questo momento"
                className="py-4 rounded-xl border-2 border-vote-yes/25 hover:border-vote-yes/70 hover:bg-vote-yes/8 text-vote-yes font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-vote-yes"
                style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.7rem', letterSpacing: '0.06em' }}
              >
                {loading ? <span className="spinner" style={{ borderTopColor: '#4ADE80', borderColor: 'rgba(74,222,128,0.2)' }} /> : '✓'}
                ANCHE IO
              </button>

              {/* NO button */}
              <button
                onClick={() => handleVote(false)}
                disabled={loading}
                aria-pressed={voted && myVote === false}
                aria-label="Solo io — non ho vissuto questo momento"
                className="py-4 rounded-xl border-2 border-border hover:border-vote-no/40 hover:bg-vote-no/5 text-muted hover:text-vote-no font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-vote-no"
                style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.7rem', letterSpacing: '0.06em' }}
              >
                {loading ? <span className="spinner" /> : '✕'}
                SOLO IO
              </button>
            </div>

            {/* Vote counter teaser */}
            <p
              className="text-center text-xs text-muted mt-3"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {votePrompt()}
            </p>
          </div>
        )}
      </div>

      {/* Share toast */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-surface border border-border rounded-full px-5 py-2.5 text-xs text-text shadow-2xl animate-fade-in">
          ✓ Link copiato negli appunti
        </div>
      )}
    </article>
  )
}

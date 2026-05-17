'use client'

import { useState } from 'react'
import type { Moment } from '@/lib/supabase'
import MomentCard from './MomentCard'

interface FeedProps {
  initialMoments: Moment[]
}

export default function Feed({ initialMoments }: FeedProps) {
  const [moments, setMoments] = useState<Moment[]>(initialMoments)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialMoments.length >= 10)
  const [seenIds] = useState<Set<string>>(() => new Set(initialMoments.map(m => m.id)))

  const loadMore = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    const nextPage = page + 1

    try {
      const res = await fetch('/api/moments?page=' + nextPage + '&limit=10', {
        headers: { 'x-anti-csrf': '1' },
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Errore di rete')
      }

      if (data.moments?.length > 0) {
        // Dedup: skip moments already in the feed
        const newMoments = data.moments.filter((m: Moment) => !seenIds.has(m.id))
        for (const m of newMoments) seenIds.add(m.id)

        if (newMoments.length > 0) {
          setMoments(prev => [...prev, ...newMoments])
        }
        setPage(nextPage)
      }
      setHasMore(data.hasMore ?? false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di caricamento')
    } finally {
      setLoading(false)
    }
  }

  // ── Empty state ──────────────────────────────────────────
  if (moments.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center" id="feed">
        <div className="text-7xl mb-6 opacity-80">👻</div>
        <h2
          className="text-2xl font-black mb-3 text-text"
          style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.1rem', letterSpacing: '-0.02em' }}
        >
          SILENZIO TOTALE
        </h2>
        <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">
          Nessuno ha ancora condiviso un momento.<br />
          Rompi il ghiaccio. Sei in buona compagnia — anche se ancora non lo sai.
        </p>
      </div>
    )
  }

  // ── Feed ─────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6" id="feed">
      {/* Moments grid */}
      <div className="space-y-4">
        {moments.map((moment, i) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            animationDelay={Math.min(i * 60, 400)}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-12 pb-10 flex flex-col items-center gap-3">
          {error && (
            <p className="text-vote-no text-xs text-center" style={{ fontFamily: 'DM Mono, monospace' }}>
              {error} —{' '}
              <button onClick={loadMore} className="underline hover:text-text transition-colors">
                riprova
              </button>
            </p>
          )}
          <button
            onClick={loadMore}
            disabled={loading}
            className="border border-border hover:border-accent/40 text-muted hover:text-text text-sm font-medium px-8 py-3 rounded-full transition-all duration-200 disabled:opacity-40 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner" />
                Caricamento...
              </>
            ) : error ? (
              'Riprova'
            ) : (
              'Carica altri momenti'
            )}
          </button>
        </div>
      )}

      {!hasMore && moments.length > 0 && (
        <p
          className="text-center text-muted text-xs mt-12 pb-10"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          — hai visto tutto —
        </p>
      )}
    </div>
  )
}

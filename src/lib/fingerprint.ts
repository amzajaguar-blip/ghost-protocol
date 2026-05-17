// Genera e persiste un fingerprint anonimo crittograficamente sicuro.
// Non raccoglie dati personali: è solo un UUID casuale via crypto.randomUUID().

const FP_KEY    = 'ghost_fp'
const VOTED_KEY = 'ghost_voted'
const MAX_VOTED_HISTORY = 500 // Cap per evitare saturazione localStorage

export function getFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr'

  try {
    let fp = localStorage.getItem(FP_KEY)
    if (!fp) {
      // crypto.randomUUID() è disponibile in tutti i browser moderni
      // e produce UUID v4 crittograficamente sicuri
      fp = crypto.randomUUID()
      try {
        localStorage.setItem(FP_KEY, fp)
      } catch {
        // localStorage potrebbe essere bloccato (private mode)
      }
    }
    return fp
  } catch {
    // Fallback per ambienti senza crypto (raro)
    const fallback = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    try { localStorage.setItem(FP_KEY, fallback) } catch { /* ignore */ }
    return fallback
  }
}

export function getVotedMoments(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(VOTED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

export function markVoted(momentId: string): void {
  if (typeof window === 'undefined') return
  try {
    const voted = getVotedMoments()
    voted.add(momentId)
    // Cap the stored set to prevent localStorage bloat over years of usage
    const entries = [...voted]
    if (entries.length > MAX_VOTED_HISTORY) {
      entries.splice(0, entries.length - MAX_VOTED_HISTORY)
    }
    localStorage.setItem(VOTED_KEY, JSON.stringify(entries))
  } catch {
    // ignore — localStorage may be full or blocked
  }
}

export function hasVoted(momentId: string): boolean {
  return getVotedMoments().has(momentId)
}

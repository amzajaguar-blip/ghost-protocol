import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { checkPostLimit, checkVoteLimit } from '@/lib/rate-limit'

// POST /api/vote
// Body: { moment_id: string, vote: boolean, fingerprint: string }
export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const postCheck = checkPostLimit(ip)
  if (!postCheck.allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova tra qualche secondo.' }, { status: 429 })
  }

  const supabase = createSupabaseServerClient()

  let body: { moment_id?: string; vote?: boolean; fingerprint?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 })
  }

  const { moment_id, vote, fingerprint } = body

  // UUID format validation
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!moment_id || !UUID_REGEX.test(moment_id)) {
    return NextResponse.json({ error: 'ID momento non valido' }, { status: 400 })
  }
  if (typeof vote !== 'boolean') {
    return NextResponse.json({ error: 'Parametro vote mancante' }, { status: 400 })
  }
  if (typeof fingerprint !== 'string' || fingerprint.length === 0 || fingerprint.length > 128) {
    return NextResponse.json({ error: 'Fingerprint non valido' }, { status: 400 })
  }

  // Per-fingerprint rate limiting
  const fpCheck = checkVoteLimit(fingerprint)
  if (!fpCheck.allowed) {
    return NextResponse.json({ error: 'Troppi voti. Riprova più tardi.' }, { status: 429 })
  }

  // ── Atomic vote via single RPC call ────────────────────
  // cast_vote does: check existing → insert vote → increment counter → return counts
  // All within a single database transaction.
  const { data, error } = await supabase.rpc('cast_vote', {
    p_moment_id: moment_id,
    p_fingerprint: fingerprint,
    p_vote: vote,
  })

  if (error) {
    console.error('[API/vote] RPC error:', error.message)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }

  return NextResponse.json(data)
}

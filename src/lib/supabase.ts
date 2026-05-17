import { createClient } from '@supabase/supabase-js'

// ── Types ────────────────────────────────────────────────
export type Moment = {
  id: string
  text: string
  image_url: string | null
  yes_count: number
  no_count: number
  created_at: string
}

export type Vote = {
  id: string
  moment_id: string
  fingerprint: string
  vote: boolean
  created_at: string
}

type Database = {
  public: {
    Tables: {
      moments: {
        Row: Moment
        Insert: { text: string; image_url?: string | null }
        Update: Partial<Moment>
      }
      votes: {
        Row: Vote
        Insert: { moment_id: string; fingerprint: string; vote: boolean }
        Update: Partial<Vote>
      }
    }
    Functions: {
      increment_vote: {
        Args: { moment_id: string; is_yes: boolean }
        Returns: void
      }
      cast_vote: {
        Args: { p_moment_id: string; p_fingerprint: string; p_vote: boolean }
        Returns: {
          alreadyVoted?: boolean
          previousVote?: boolean
          success?: boolean
          yes_count: number
          no_count: number
        }
      }
    }
  }
}

// ── Client-side (anon key) ────────────────────────────────
export function createSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── Server-side (ANON key — respects RLS) ─────────────────
export function createSupabaseServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// ── Admin (service role) — ONLY for operations that truly need RLS bypass ──
export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

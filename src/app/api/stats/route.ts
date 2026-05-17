import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

// GET /api/stats — aggregate platform stats (cached via CDN)
export async function GET() {
  const supabase = createSupabaseServerClient()

  try {
    const { count: totalMoments, error: momentsError } = await supabase
      .from('moments')
      .select('*', { count: 'exact', head: true })

    if (momentsError) {
      return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
    }

    // Return minimal stats
    return NextResponse.json(
      {
        totalMoments: totalMoments ?? 0,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

import { createSupabaseServerClient } from '@/lib/supabase'
import { Suspense } from 'react'
import Header from '@/components/Header'
import Feed from '@/components/Feed'
import FeedSkeleton from '@/components/FeedSkeleton'
import HeroOnboardingWrapper from '@/components/HeroOnboardingWrapper'
import Analytics from '@/components/Analytics'
import CookieBanner from '@/components/CookieBanner'
import Footer from '@/components/Footer'

// Rivalidate ogni 60 secondi (ISR)
export const revalidate = 60

export default async function Home() {
  const supabase = createSupabaseServerClient()

  const [momentsRes, statsRes] = await Promise.all([
    supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 9),
    supabase
      .from('moments')
      .select('*', { count: 'exact', head: true }),
  ])

  const moments = momentsRes.data ?? []
  const totalMoments = statsRes.count ?? 0

  if (momentsRes.error) {
    console.error('Supabase moments error:', momentsRes.error.message)
  }

  return (
    <>
      <Analytics />
      <Header />
      <HeroOnboardingWrapper totalMoments={totalMoments}>
        <main className="min-h-dvh bg-bg">
          <Suspense fallback={<FeedSkeleton />}>
            <Feed initialMoments={moments} />
          </Suspense>
        </main>
      </HeroOnboardingWrapper>
      <Footer />
      <CookieBanner />
    </>
  )
}

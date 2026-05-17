import { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghost-protocol.app'

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ]

  // Dynamically include recent moments (top 100 by recency)
  // Remove this try/catch block if you want the build to fail loudly
  // when Supabase is unavailable
  try {
    const supabase = createSupabaseServerClient()
    const { data: moments } = await supabase
      .from('moments')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (moments) {
      for (const moment of moments) {
        entries.push({
          url: `${baseUrl}/m/${moment.id}`,
          lastModified: new Date(moment.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })
      }
    }
  } catch {
    // Supabase unavailable during build — static sitemap is sufficient
    console.warn('[sitemap] Could not fetch moments from Supabase. Sitemap will only contain homepage.')
  }

  return entries
}

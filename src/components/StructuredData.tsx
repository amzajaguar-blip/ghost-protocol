/**
 * Structured Data (JSON-LD) components for Ghost Protocol.
 *
 * WebApplication schema on every page (via layout).
 * SocialMediaPosting schema on individual moment pages (via /m/[id]).
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghost-protocol.app'

// ── WebApplication (site-wide) ──────────────────────────────

export function WebsiteSchema() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${BASE_URL}/#webapp`,
    name: 'Ghost Protocol',
    description:
      'Scopri quante persone hanno vissuto esattamente quello che stai vivendo. Condividi un momento anonimo e vedi il % di umanità che ha vissuto la stessa esperienza.',
    url: BASE_URL,
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'All',
    inLanguage: 'it',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    author: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#org`,
      name: 'Ghost Protocol',
      url: BASE_URL,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ── SocialMediaPosting (per-moment page) ────────────────────

interface MomentSchemaProps {
  id: string
  text: string
  yesCount: number
  noCount: number
  totalVotes: number
  yesPercent: number
  imageUrl: string | null
  createdAt: string
}

export function MomentSchema({
  id,
  text,
  yesCount,
  noCount,
  totalVotes,
  yesPercent,
  imageUrl,
  createdAt,
}: MomentSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': `${BASE_URL}/m/${id}#post`,
    headline: text.length > 110 ? text.slice(0, 107) + '…' : text,
    text: text,
    datePublished: createdAt,
    dateModified: createdAt,
    url: `${BASE_URL}/m/${id}`,
    inLanguage: 'it',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#webapp`,
      name: 'Ghost Protocol',
      url: BASE_URL,
    },
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
        caption: text.slice(0, 200),
      },
    }),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'LikeAction' },
        userInteractionCount: yesCount,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'DisagreeAction' },
        userInteractionCount: noCount,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'VoteAction' },
        userInteractionCount: totalVotes,
      },
    ],
    // Non-standard but useful for rich snippet experimentation
    description: `Il ${yesPercent}% delle persone ha vissuto questo. ${yesCount} sì · ${noCount} no · ${totalVotes} voti totali.`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

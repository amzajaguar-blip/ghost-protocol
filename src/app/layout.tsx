import type { Metadata } from 'next'
import { WebsiteSchema } from '@/components/StructuredData'
import './globals.css'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghost-protocol.app'

export const metadata: Metadata = {
  // ── Critical: absolute base for all relative URLs ────────
  metadataBase: new URL(BASE_URL),

  // ── Primary ───────────────────────────────────────────────
  title: {
    template: '%s — Ghost Protocol',
    default: 'Ghost Protocol — Non sei l\'unico',
  },
  description:
    'Scopri quante persone hanno vissuto esattamente quello che stai vivendo. Condividi un momento anonimo e vedi il % di umanità che l\'ha vissuto.',

  // ── Canonical ────────────────────────────────────────────
  alternates: {
    canonical: '/',
  },

  // ── Robots ────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },

  // ── Viewport (PWA) ───────────────────────────────────────
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#08080A',
  },

  // ── Open Graph ───────────────────────────────────────────
  openGraph: {
    title: 'Ghost Protocol — Non sei l\'unico',
    description:
      'Non sei l\'unico. Scopri quante persone hanno vissuto esattamente quello che stai vivendo.',
    url: BASE_URL,
    siteName: 'Ghost Protocol',
    type: 'website',
    locale: 'it_IT',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Ghost Protocol — Non sei l\'unico',
      },
    ],
  },

  // ── Twitter ──────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'Ghost Protocol — Non sei l\'unico',
    description:
      'Non sei l\'unico. Condividi un momento anonimo e scopri il % di umanità che l\'ha vissuto.',
    images: ['/og-default.png'],
  },

  // ── Icons ────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/apple-touch-icon.png',
  },

  // ── PWA ──────────────────────────────────────────────────
  manifest: '/manifest.json',

  // ── Keywords ─────────────────────────────────────────────
  keywords: [
    'confessioni anonime',
    'esperienze anonime',
    'condividi un segreto',
    'non sei l unico',
    'ghost protocol',
    'mi e mai capitato',
    'anche io l ho vissuto',
    'sondaggio anonimo',
    'quante persone hanno vissuto',
    'piattaforma anonima',
    'confessioni online',
    'anonimo',
    'esperienze condivise',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        {/* Font preconnects — replace with next/font for best LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        {/* Color scheme for browser chrome */}
        <meta name="theme-color" content="#08080A" />
        <meta name="color-scheme" content="dark" />

        {/* PWA: Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {})
                })
              }
            `,
          }}
        />
      </head>
      <body>
        <WebsiteSchema />
        {children}
      </body>
    </html>
  )
}

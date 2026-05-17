'use client'

import React from 'react'

export default function Analytics() {
  // Analytics are deferred until cookie consent is granted.
  // This component renders nothing; it's a placeholder for GA4/Meta Pixel.
  // Add your measurement IDs in .env.local:
  //   NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
  //   NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXXXXXXX

  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const hasConsent = typeof window !== 'undefined'
    && localStorage.getItem('cookie_consent') === 'accepted'

  if (!hasConsent || (!ga4Id && !pixelId)) return null

  return (
    <>
      {ga4Id && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}', { anonymize_ip: true });
              `,
            }}
          />
        </>
      )}
      {pixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
    </>
  )
}

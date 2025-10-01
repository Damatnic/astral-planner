// Catalyst Performance Layout - Optimized Font Loading
import { Inter, Caveat } from 'next/font/google';
import { Providers } from '@/providers/providers';
import { Analytics } from '@/components/analytics/Analytics';
import { Toaster } from 'sonner';
import './globals.css';
import { headers } from 'next/headers';

// CATALYST CRITICAL FIX: Import performance monitor
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

// SEO Components
import { 
  generateAppJsonLd, 
  generateOrganizationJsonLd 
} from '@/lib/seo/metadata';

// Primary fonts - preloaded for critical rendering path
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

// Essential handwriting font - optimized loading
const caveat = Caveat({ 
  subsets: ['latin'], 
  variable: '--font-caveat',
  display: 'swap',
  preload: false
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://astralplanner.app'),
  title: {
    default: 'Astral Planner - AI-Powered Digital Planning & Productivity',
    template: '%s | Astral Planner',
  },
  description: 'Transform your productivity with Astral Planner\'s AI-powered digital planning solution. Manage tasks, track goals, build habits, and collaborate in real-time. Free to start.',
  keywords: [
    'digital planner',
    'AI task management',
    'productivity app',
    'goal tracking',
    'habit tracker',
    'time management',
    'calendar integration',
    'collaboration tools',
    'project management',
    'personal organizer'
  ],
  authors: [{ name: 'Astral Planner Team' }],
  creator: 'Astral Planner',
  publisher: 'Astral Planner',
  category: 'productivity',
  classification: 'Business',
  manifest: '/manifest.json',
  
  // Open Graph
  openGraph: {
    title: 'Astral Planner - AI-Powered Digital Planning & Productivity',
    description: 'Transform your productivity with AI-powered digital planning. Manage tasks, track goals, build habits, and collaborate in real-time.',
    url: '/',
    siteName: 'Astral Planner',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Astral Planner - AI-Powered Digital Planning',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Astral Planner - AI-Powered Digital Planning & Productivity',
    description: 'Transform your productivity with AI-powered digital planning. Manage tasks, track goals, build habits, and collaborate in real-time.',
    site: '@astralplanner',
    creator: '@astralplanner',
    images: ['/twitter-image.png'],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // App-specific
  applicationName: 'Astral Planner',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Verification
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
    },
  },

  // App Links
  appLinks: {
    web: {
      url: '/',
      should_fallback: true,
    },
  },

  // Icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#000000' },
    ],
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const incomingHeaders = await headers();
  const cspNonce = process.env.NODE_ENV === 'development'
    ? undefined
    : incomingHeaders.get('x-csp-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          nonce={cspNonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateAppJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          nonce={cspNonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationJsonLd()),
          }}
        />
        {cspNonce && <meta name="csp-nonce" content={cspNonce} />}
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="https://api.astralplanner.app" />
        <link rel="dns-prefetch" href="https://analytics.astralplanner.app" />
      </head>
      <body className={`${inter.className} ${caveat.variable}`} data-csp-nonce={cspNonce}>
        <Providers cspNonce={cspNonce}>
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
          <Analytics />
          <PerformanceMonitor />
        </Providers>
        <script
          nonce={cspNonce}
          dangerouslySetInnerHTML={{
            __html: `
              // Development: Service worker completely disabled
              if ('serviceWorker' in navigator && typeof navigator.serviceWorker.getRegistrations === 'function') {
                // Unregister any existing service workers in development
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
              
              // Handle browser extension interference in development
              if (typeof window !== 'undefined' && document.body) {
                // Remove browser extension attributes that cause hydration warnings
                const extensionAttrs = ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'];
                extensionAttrs.forEach(attr => {
                  if (document.body.hasAttribute(attr)) {
                    document.body.removeAttribute(attr);
                  }
                });
              }
              
              console.log('Service worker disabled for development');
            `
          }}
        />
      </body>
    </html>
  );
}
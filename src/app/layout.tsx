import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import { PWAProvider } from '@/components/providers/pwa-provider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Ultimate Digital Planner',
    template: '%s | Ultimate Digital Planner'
  },
  description: 'The world\'s most advanced digital planning system with AI-powered insights, time blocking, goal tracking, and seamless integrations.',
  keywords: [
    'digital planner',
    'productivity',
    'time management',
    'goal tracking',
    'habit tracker',
    'calendar',
    'time blocking',
    'AI planning',
    'task management',
    'project management'
  ],
  authors: [{ name: 'Ultimate Digital Planner Team' }],
  creator: 'Ultimate Digital Planner',
  publisher: 'Ultimate Digital Planner',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Ultimate Digital Planner',
    description: 'The world\'s most advanced digital planning system with AI-powered insights, time blocking, goal tracking, and seamless integrations.',
    siteName: 'Ultimate Digital Planner',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ultimate Digital Planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ultimate Digital Planner',
    description: 'The world\'s most advanced digital planning system with AI-powered insights, time blocking, goal tracking, and seamless integrations.',
    images: ['/og-image.png'],
    creator: '@digitalplanner',
  },
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
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#3b82f6',
      },
    ],
  },
  appleWebApp: {
    title: 'Ultimate Digital Planner',
    statusBarStyle: 'default',
    capable: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  category: 'productivity',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          card: 'shadow-lg border',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
        },
      }}
    >
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://api.openai.com" />
          <link rel="dns-prefetch" href="https://socket.io" />
          
          {/* Preload critical resources */}
          <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          
          {/* Critical CSS for above-the-fold content */}
          <style jsx>{`
            /* Critical CSS will be inlined here */
            .loading-spinner {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </head>
        <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
          <ErrorBoundary>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <QueryProvider>
                <AnalyticsProvider>
                  <PWAProvider>
                    <div className="relative flex min-h-screen flex-col">
                      <div className="flex-1">
                        {children}
                      </div>
                    </div>
                    <ToastProvider />
                  </PWAProvider>
                </AnalyticsProvider>
              </QueryProvider>
            </ThemeProvider>
          </ErrorBoundary>
          
          {/* Service Worker Registration */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
          
          {/* Analytics Scripts */}
          {process.env.NODE_ENV === 'production' && (
            <>
              {/* Vercel Analytics */}
              <script async src="https://vercel.com/insights/script.js" />
              
              {/* PostHog Analytics */}
              {process.env.NEXT_PUBLIC_POSTHOG_KEY && (
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);var n=t;if("undefined"!=typeof e)try{n=t[e]}catch(t){return void console.error("PostHog error:",t)}var p=function(){n.apply(t,arguments)};p.q=[];var r=p.q;n.q=r,e.autocapture=!0,e.disable_session_recording=!1},g(e,i);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                      posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}',{api_host:'${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'}'})
                    `,
                  }}
                />
              )}
            </>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
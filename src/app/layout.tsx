// Catalyst Performance Layout - Optimized Font Loading
import { Inter, Caveat } from 'next/font/google';
import { Providers } from '@/providers/providers';
import { Analytics } from '@/components/analytics/Analytics';
import { Toaster } from 'sonner';
import './globals.css';

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
  title: 'Astral Chronos',
  description: 'Astral Chronos - AI-powered digital planning solution with real-time collaboration',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${caveat.variable}`}>
        <Providers>
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
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Service worker cleanup script
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                  if (event.data && event.data.type === 'CACHE_CLEARED') {
                    console.log('Service worker reported cache cleared, reloading page...');
                    window.location.reload();
                  }
                });
                
                // Register the cleanup service worker
                navigator.serviceWorker.register('/sw.js')
                  .then(() => {
                    // Silently register - only log if needed for debugging
                    if (window.location.hostname === 'localhost') {
                      console.log('Cleanup service worker registered');
                    }
                  })
                  .catch(err => {
                    if (window.location.hostname === 'localhost') {
                      console.log('Service worker registration failed:', err);
                    }
                  });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
// Authentication handled by Stack Auth via middleware
import { Inter, Caveat, Dancing_Script, Kalam, Architects_Daughter, Indie_Flower, Shadows_Into_Light, Permanent_Marker, Amatic_SC } from 'next/font/google';
import { Providers } from '@/providers/providers';
import { Analytics } from '@/components/analytics/Analytics';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Handwriting fonts for authentic planner feel
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-dancing-script' });
const kalam = Kalam({ subsets: ['latin'], weight: ['300', '400', '700'], variable: '--font-kalam' });
const architectsDaughter = Architects_Daughter({ subsets: ['latin'], weight: '400', variable: '--font-architects-daughter' });
const indieFlower = Indie_Flower({ subsets: ['latin'], weight: '400', variable: '--font-indie-flower' });
const shadowsIntoLight = Shadows_Into_Light({ subsets: ['latin'], weight: '400', variable: '--font-shadows-into-light' });
const permanentMarker = Permanent_Marker({ subsets: ['latin'], weight: '400', variable: '--font-permanent-marker' });
const amaticSc = Amatic_SC({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-amatic-sc' });

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
      <body className={`${inter.className} ${caveat.variable} ${dancingScript.variable} ${kalam.variable} ${architectsDaughter.variable} ${indieFlower.variable} ${shadowsIntoLight.variable} ${permanentMarker.variable} ${amaticSc.variable}`}>
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
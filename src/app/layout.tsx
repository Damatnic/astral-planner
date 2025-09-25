// TEMPORARY: Clerk disabled for development - using Stack Auth credentials
// import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Caveat, Dancing_Script, Kalam, Architects_Daughter, Indie_Flower, Shadows_Into_Light, Permanent_Marker, Amatic_SC } from 'next/font/google';
import { Providers } from '@/providers/providers';
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
  title: 'Ultimate Digital Planner',
  description: 'AI-powered digital planning solution with real-time collaboration',
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
        </Providers>
      </body>
    </html>
  );
}
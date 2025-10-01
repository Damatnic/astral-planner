'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { PWAProvider } from '@/components/providers/pwa-provider';
import { ShortcutsProvider } from './shortcuts-provider';
import { CollaborationProvider } from '@/components/collaboration/CollaborationProvider';
import { UserPreferencesProvider } from '@/hooks/use-user-preferences';
import { createContext, useContext, useState } from 'react';

const CspNonceContext = createContext<string | undefined>(undefined);

export function useCspNonce(): string | undefined {
  return useContext(CspNonceContext);
}

// CATALYST CRITICAL: Ultra-lazy loading for DevTools (production excluded)
const ReactQueryDevtools = process.env.NODE_ENV === 'development' 
  ? dynamic(
      () => import('@tanstack/react-query-devtools').then(mod => ({ default: mod.ReactQueryDevtools })),
      { 
        ssr: false,
        loading: () => null, // No loading state to reduce bundle
      }
    )
  : () => null;

export function Providers({ children, cspNonce }: { children: React.ReactNode; cspNonce?: string }) {
  // CATALYST CRITICAL: Ultra-optimized query client for performance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000, // INCREASED to 10 minutes for less refetching
        gcTime: 15 * 60 * 1000, // INCREASED: 15 minutes garbage collection
        refetchOnWindowFocus: false, // DISABLE to reduce network calls
        refetchOnMount: false, // DISABLE to reduce network calls
        refetchOnReconnect: false, // DISABLE to reduce network calls
        networkMode: 'offlineFirst', // CRITICAL: Offline-first for better performance
        retry: (failureCount, error: unknown) => {
          const apiError = error as { status?: number };
          const status = apiError?.status;
          // CRITICAL: Stop infinite retries immediately for known errors
          if (status !== undefined && (status === 404 || status === 401 || status === 403 || status >= 500)) {
            return false;
          }
          return failureCount < 1; // REDUCED to 1 retry only
        },
        retryDelay: () => 1000, // FIXED: 1 second delay only
      },
      mutations: {
        retry: 0, // CRITICAL: No mutation retries for faster UX
        networkMode: 'offlineFirst',
      },
    },
    // CRITICAL: Minimal query cache for memory efficiency
    queryCache: undefined, // Use default with garbage collection
    mutationCache: undefined, // Use default with garbage collection
  }));

  return (
    <CspNonceContext.Provider value={cspNonce}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          disableTransitionOnChange
          storageKey="astral-theme"
        >
          <AuthProvider>
            <UserPreferencesProvider>
              <PWAProvider>
                <CollaborationProvider workspaceId="default-workspace">
                  <ShortcutsProvider>
                    {children}
                  </ShortcutsProvider>
                </CollaborationProvider>
              </PWAProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </CspNonceContext.Provider>
  );
}
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { PWAProvider } from '@/components/providers/pwa-provider';
import { ShortcutsProvider } from './shortcuts-provider';
import { CollaborationProvider } from '@/components/collaboration/CollaborationProvider';
import { UserPreferencesProvider } from '@/hooks/use-user-preferences';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error: unknown) => {
          const apiError = error as { status?: number };
          if (apiError?.status === 404 || apiError?.status === 401) return false;
          return failureCount < 3;
        },
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
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
      {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
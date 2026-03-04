import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is served from local SQLite cache, so stale time can be long.
      // The sync hook invalidates queries after each sync completes.
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 30 * 60 * 1000,          // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,     // SQLite sync handles freshness
      refetchOnReconnect: true,        // Re-sync when network comes back
    },
    mutations: {
      // Mutations write to SQLite immediately (optimistic-style).
      // The dirty flag triggers background sync to Supabase.
      retry: 0,
    },
  },
});

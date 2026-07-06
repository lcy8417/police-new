import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide TanStack Query client. Replaces the old `registerFlag`
 * full-refetch pattern: server data is cached here and refreshed via
 * `queryClient.invalidateQueries(...)` once entity queries land (Phase 3+).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

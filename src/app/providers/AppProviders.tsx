import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/shared/ui/sonner";
import { queryClient } from "./query-client";

/**
 * Composition root for app-wide providers. Wires TanStack Query and the
 * global toast surface: API success/error feedback is driven centrally by
 * the query cache (see `query-client.ts`), rendered here through a single
 * `<Toaster/>`.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-center" />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

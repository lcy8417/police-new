import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { queryClient } from "./query-client";

/**
 * Composition root for app-wide providers. Wires TanStack Query and the
 * global toast surface: API success/error feedback is driven centrally by
 * the query cache (see `query-client.ts`), rendered here through a single
 * `<Toaster/>`. `TooltipProvider` is hoisted here so any shadcn `Tooltip`
 * anywhere in the tree (e.g. the 가시성 보정 dock's slider readouts) works
 * without each feature re-wrapping its own provider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster richColors position="top-center" />
      </TooltipProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/client";

/** Extract a user-facing message from a query/mutation error, Korean-friendly. */
function messageOf(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return undefined;
}

/**
 * App-wide TanStack Query client. Replaces the old `registerFlag`
 * full-refetch pattern: server data is cached here and refreshed via
 * `queryClient.invalidateQueries(...)` once entity queries land (Phase 3+).
 *
 * Also the single place API success/failure feedback is surfaced: the query
 * cache toasts on every failed query, the mutation cache toasts on every
 * failed mutation, and on success reads `mutation.meta.success` (a Korean
 * string) to fire a success toast. Callers never call `toast` directly.
 *
 * `mutation.meta.inlineError === true`면 실패 토스트를 띄우지 않는다 — 그 화면이 오류 문구를
 * 폼·패널 안에 직접 보여 주는 경우(관리자 화면의 서버 안내 문구 등) 같은 문구가 두 번 뜨지 않게.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(messageOf(error) ?? "데이터를 불러오지 못했습니다");
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.inlineError === true) return;
      toast.error(messageOf(error) ?? "요청 처리에 실패했습니다");
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      const message = mutation.meta?.success;
      if (typeof message === "string") toast.success(message);
    },
  }),
});

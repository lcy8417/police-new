import { useQuery } from "@tanstack/react-query";

import { fetchCrimeList } from "./crime-api";
import { crimeKeys } from "./query-keys";

/**
 * GET /crime/ 목록 쿼리(새 사건관리 `/cases` — 화면 이식 계획 §5 R1: 새 페이지는 전역 `useCrimeStore` 대신 TanStack 쿼리만).
 * 서버가 쪽 나누기를 하지 않아 한 번에 받고 쪽은 화면이 나눈다. 다른 화면(옛 등록 · 사건 창)에서 바꾼 뒤 목록으로 돌아오면
 * 다시 읽도록 `refetchOnMount: "always"`. 문양 경로 hydrate 는 하지 않는다(목록은 문양을 그리지 않는다).
 */
export function useCrimeListQuery() {
  return useQuery({
    queryKey: crimeKeys.list(),
    queryFn: fetchCrimeList,
    refetchOnMount: "always",
  });
}

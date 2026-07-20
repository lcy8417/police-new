/**
 * SPEC-MATCH-TOP10-001: top-10 매칭 상태 소유 훅.
 *
 * 4종 409 게이트(REQ-MATCH-009/009b/009c/009d)를 일반 오류와 구분해 노출한다 —
 * 특히 `ALIGNMENT_NOT_SET`은 호출자가 SPEC-3 정렬 UI(`features/crime-align`)로
 * 라우팅할 수 있도록 `gateCode`로 별도 노출한다.
 */
import { useQuery } from "@tanstack/react-query";

import { MatchGateError, fetchMatchTop10, matchTop10Keys } from "@/entities/match";
import type { MatchCorrespondence, MatchGateCode, MatchGateErrorDetail } from "@/entities/match";

export interface UseMatchTop10Params {
  crimeNumber: string;
  modelNumber: string;
  /** 사용자가 명시적으로 매칭을 요청했을 때만 조회를 시작한다(자동 트리거 아님 —
   * GPU 추론 비용이 크므로 화면 진입만으로 발사하지 않는다). */
  enabled: boolean;
}

export interface UseMatchTop10 {
  matches: MatchCorrespondence[];
  isLoading: boolean;
  isError: boolean;
  /** 409 게이트 코드(REQ-MATCH-009/009b/009c/009d) — 일반 오류와 구분해 분기 처리. */
  gateCode: MatchGateCode | null;
  gateDetail: MatchGateErrorDetail | null;
  /** 게이트가 아닌 일반 오류(네트워크 등) 여부. */
  isGenericError: boolean;
  refetch: () => void;
}

export function useMatchTop10({ crimeNumber, modelNumber, enabled }: UseMatchTop10Params): UseMatchTop10 {
  const query = useQuery({
    queryKey: matchTop10Keys.detail(crimeNumber, modelNumber),
    queryFn: () => fetchMatchTop10({ crimeNumber, modelNumber }),
    enabled: enabled && Boolean(crimeNumber) && Boolean(modelNumber),
    retry: false, // 409 게이트는 재시도로 해소되지 않음(정렬/윤곽/신발 상태가 바뀌어야 함).
  });

  const gateError = query.error instanceof MatchGateError ? query.error : null;

  return {
    matches: query.data?.matches ?? [],
    isLoading: query.isFetching,
    isError: query.isError,
    gateCode: gateError?.detail.code ?? null,
    gateDetail: gateError?.detail ?? null,
    isGenericError: query.isError && gateError === null,
    refetch: () => void query.refetch(),
  };
}

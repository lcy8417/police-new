import { ApiError, backendFetch } from "@/shared/api";
import type { FetchMatchTop10Input, MatchGateErrorDetail, MatchTop10ResponseDto } from "../model/types";
import { MatchGateError } from "../model/types";

/**
 * POST /crime/:aprthngNo/match_top10?ftwr_id=... — top-10 대응 매칭(REQ-MATCH-007).
 *
 * `apiSend`(shared/api/client)를 재사용하지 않는 이유: 4종 409 게이트(REQ-MATCH-009/
 * 009b/009c/009d)는 응답 본문(`detail.code`, 객체)으로 원인을 구분해야 하는데, `apiSend`는
 * 문자열 `detail`만 꺼내고 객체 본문은 버린 채 일반 `ApiError`를 던진다. 게이트 코드를
 * 프런트가 분기 처리할 수 있도록 이 함수는 409 응답 본문을 파싱해 `MatchGateError`로
 * 던진다 — 네 코드 모두(특히 `COORDINATE_SPACE_MISMATCH`) 삼키지 않고 호출부로
 * 전달한다(사용자 지시 [CORRECTION] 반영). 전송 자체는 공용 `backendFetch`(쿠키·401/403 처리).
 */
export async function fetchMatchTop10({
  aprthngNo,
  ftwrId,
}: FetchMatchTop10Input): Promise<MatchTop10ResponseDto> {
  const params = new URLSearchParams({ ftwr_id: ftwrId });
  const response = await backendFetch(
    `/crime/${encodeURIComponent(aprthngNo)}/match_top10?${params.toString()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (response.status === 409) {
    const body = (await response.json()) as { detail: MatchGateErrorDetail };
    throw new MatchGateError(body.detail);
  }

  if (!response.ok) {
    throw new ApiError("매칭 요청에 실패했습니다", response.status);
  }

  return (await response.json()) as MatchTop10ResponseDto;
}

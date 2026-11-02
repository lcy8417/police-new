import { apiGet, apiSend } from "@/shared/api";
import type {
  Alignment,
  AlignmentDto,
  FetchAlignmentInput,
  LatestAlignmentDto,
  SaveAlignmentInput,
} from "../model/types";

/** 감정물 번호를 URL 경로 조각으로 — 허용 문자만 쓰지만 방어용으로 인코딩한다. */
const alignmentPath = (aprthngNo: string) => `/crime/${encodeURIComponent(aprthngNo)}/alignment`;

/**
 * GET /crime/:aprthngNo/alignment?ftwr_id=... — (감정물, 신발) 정렬 조회.
 * REQ-ALIGN-010a: CRUD(camelCase) 계층 배치 — 이미지 무변환 계층(services/api.js)에는
 * 두지 않는다. 응답 필드(polygon/arrow)는 snake_case가 아니므로 변환은 불필요.
 */
export async function fetchAlignment({
  aprthngNo,
  ftwrId,
}: FetchAlignmentInput): Promise<Alignment> {
  const params = new URLSearchParams({ ftwr_id: ftwrId });
  return apiGet<AlignmentDto>(`${alignmentPath(aprthngNo)}?${params.toString()}`);
}

/**
 * POST /crime/:aprthngNo/alignment?ftwr_id=... — UPSERT 저장(REQ-ALIGN-009).
 * 백엔드가 저장된 polygon/arrow/flipHorizontal을 그대로 응답 본문에 반환한다.
 * REQ-ALIGN-020a(H2): `flipHorizontal`은 별도 불리언 필드로만 전송되며, polygon/arrow
 * 좌표는 반전과 무관하게 항상 반전 적용 전 값이다 — 이 함수는 좌표를 변환하지 않는다.
 */
export async function saveAlignment({
  aprthngNo,
  ftwrId,
  polygon,
  arrow,
  flipHorizontal,
}: SaveAlignmentInput): Promise<Alignment> {
  const params = new URLSearchParams({ ftwr_id: ftwrId });
  const response = await apiSend(
    `${alignmentPath(aprthngNo)}?${params.toString()}`,
    "POST",
    { polygon, arrow, flipHorizontal }
  );
  return (await response.json()) as AlignmentDto;
}

/**
 * GET /crime/:aprthngNo/alignment/latest — 같은 감정물에서 가장 최근에 저장된 정렬을
 * 신발과 무관하게 조회한다(응답 `ftwrId`는 출처 신발).
 *
 * 폴리곤·화살표는 `저장 현장 이미지 좌표계`에만 정의된 값이라 후보 신발이 바뀌어도
 * 동일하다(현장 이미지가 고정). 새 후보를 열 때 이 값을 이어받아 재작도를 없애는
 * 프리필 소스로만 쓴다 — 저장 구조는 여전히 (감정물, 신발) 쌍 단위다.
 */
export async function fetchLatestAlignment({
  aprthngNo,
}: {
  aprthngNo: string;
}): Promise<LatestAlignmentDto> {
  return apiGet<LatestAlignmentDto>(`${alignmentPath(aprthngNo)}/latest`);
}

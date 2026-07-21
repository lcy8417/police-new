import { apiGet, apiSend } from "@/shared/api";
import type {
  Alignment,
  AlignmentDto,
  FetchAlignmentInput,
  LatestAlignmentDto,
  SaveAlignmentInput,
} from "../model/types";

/**
 * GET /crime/:crimeNumber/alignment?model_number=... — (crime,shoe) 정렬 조회.
 * REQ-ALIGN-010a: CRUD(camelCase) 계층 배치 — 이미지 무변환 계층(services/api.js)에는
 * 두지 않는다. 응답 필드(polygon/arrow)는 snake_case가 아니므로 변환은 불필요.
 */
export async function fetchAlignment({
  crimeNumber,
  modelNumber,
}: FetchAlignmentInput): Promise<Alignment> {
  const params = new URLSearchParams({ model_number: modelNumber });
  return apiGet<AlignmentDto>(`/crime/${crimeNumber}/alignment?${params.toString()}`);
}

/**
 * POST /crime/:crimeNumber/alignment?model_number=... — UPSERT 저장(REQ-ALIGN-009).
 * 백엔드가 저장된 polygon/arrow/flipHorizontal을 그대로 응답 본문에 반환한다.
 * REQ-ALIGN-020a(H2): `flipHorizontal`은 별도 불리언 필드로만 전송되며, polygon/arrow
 * 좌표는 반전과 무관하게 항상 반전 적용 전 값이다 — 이 함수는 좌표를 변환하지 않는다.
 */
export async function saveAlignment({
  crimeNumber,
  modelNumber,
  polygon,
  arrow,
  flipHorizontal,
}: SaveAlignmentInput): Promise<Alignment> {
  const params = new URLSearchParams({ model_number: modelNumber });
  const response = await apiSend(
    `/crime/${crimeNumber}/alignment?${params.toString()}`,
    "POST",
    { polygon, arrow, flipHorizontal }
  );
  return (await response.json()) as AlignmentDto;
}

/**
 * GET /crime/:crimeNumber/alignment/latest — 같은 사건에서 가장 최근에 저장된 정렬을
 * 신발 모델과 무관하게 조회한다.
 *
 * 폴리곤·화살표는 `저장 현장 이미지 좌표계`에만 정의된 값이라 후보 신발이 바뀌어도
 * 동일하다(현장 이미지가 고정). 새 후보를 열 때 이 값을 이어받아 재작도를 없애는
 * 프리필 소스로만 쓴다 — 저장 구조는 여전히 (사건, 신발) 쌍 단위다.
 */
export async function fetchLatestAlignment({
  crimeNumber,
}: {
  crimeNumber: string;
}): Promise<LatestAlignmentDto> {
  return apiGet<LatestAlignmentDto>(`/crime/${crimeNumber}/alignment/latest`);
}

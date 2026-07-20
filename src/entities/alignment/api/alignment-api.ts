import { apiGet, apiSend } from "@/shared/api";
import type {
  Alignment,
  AlignmentDto,
  FetchAlignmentInput,
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

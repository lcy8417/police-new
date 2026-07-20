/**
 * SPEC-MATCH-TOP10-001: 현장↔신발 top-10 대응 매칭 도메인 타입.
 *
 * `POST /crime/:crimeNumber/match_top10` 응답 wire shape. 필드는 snake_case가
 * 아니므로(fx/fy/sx/sy/score/box/box_image) camelCase 변환은 box_image 한
 * 필드에만 필요하다 — 나머지는 그대로 사용 가능(SPEC-3 alignment-api.ts와 동일
 * 규약: 좌표/설정 데이터 클래스는 그대로, 서버 전용 스네이크만 개별 매핑).
 */

/** 96px 고정 박스 계약(REQ-MATCH-005) — `저장 현장 이미지 좌표계` 절대 픽셀. */
export interface MatchBox {
  /** 박스 중심 x — 항상 대응점 fx와 정확히 일치(clamp 없음, REQ-MATCH-005a). */
  cx: number;
  /** 박스 중심 y — 항상 대응점 fy와 정확히 일치. */
  cy: number;
  /** 박스 한 변(px). 계약값 96(MATCH_BOX_SIZE_PX). */
  size: number;
}

/** top-10 대응점 1건의 wire shape(서버 응답 그대로). */
export interface MatchCorrespondenceDto {
  /** 현장측 대응점 x — `저장 현장 이미지 좌표계`. */
  fx: number;
  /** 현장측 대응점 y — `저장 현장 이미지 좌표계`. */
  fy: number;
  /** 신발측 대응점 x — `신발 이진 이미지 좌표계`(현장과 별개 공간). */
  sx: number;
  /** 신발측 대응점 y — `신발 이진 이미지 좌표계`. */
  sy: number;
  /** mutual-NN 코사인 유사도(0~1 도메인 — 레거시 search API의 0~100 퍼센트와 다름). */
  score: number;
  box: MatchBox;
  /** 96px crop의 base64 PNG data URL — 카드 그리드 렌더용(spec.md §A.2 최소 계약에
   * 덧붙인 additive 필드). */
  box_image: string;
}

/** 앱 모델 — wire shape과 동일(현재는 별도 변환 불필요). */
export type MatchCorrespondence = MatchCorrespondenceDto;

export interface MatchTop10ResponseDto {
  matches: MatchCorrespondenceDto[];
  crime_number: string;
  model_number: string;
}

export interface FetchMatchTop10Input {
  crimeNumber: string;
  modelNumber: string;
}

/**
 * spec.md §F 확정 게이트 코드 4종(REQ-MATCH-009/009b-1/009c/009d) — 서로 다른 문자열.
 *
 * v0.6.0 CHANGE 1(역전): `OUTLINE_NOT_GENERATED`(윤곽 미생성 시 차단)는 **폐기**되었다.
 * 윤곽 미생성은 이제 자동 계산 후 매칭이 계속 진행되는 정상 초기 상태이며(REQ-MATCH-009b
 * 안전망 폴백), 그 자동 계산 자체가 실패한 경우에만 `OUTLINE_GENERATION_FAILED`(신규
 * 코드)로 fail-fast한다. 이후 독자가 "게이트가 사라졌다"고 판단해 `OUTLINE_NOT_GENERATED`
 * 차단을 되살이면 안 된다(spec.md §F 역전 기록).
 */
export type MatchGateCode =
  | "ALIGNMENT_NOT_SET"
  | "OUTLINE_GENERATION_FAILED"
  | "SHOE_BINARY_NOT_AVAILABLE"
  | "COORDINATE_SPACE_MISMATCH";

/** 409 게이트 응답 본문(FastAPI `{"detail": {...}}` 래핑을 벗긴 형태). */
export interface MatchGateErrorDetail {
  code: MatchGateCode;
  crime_number: string;
  model_number?: string;
  recompute_path?: string;
  reason?: string;
  outline_size?: [number, number];
  scene_size?: [number, number];
}

/** 매칭 게이트 실패를 일반 네트워크 오류와 구분하기 위한 타입드 오류. */
export class MatchGateError extends Error {
  readonly detail: MatchGateErrorDetail;

  constructor(detail: MatchGateErrorDetail) {
    super(`match_top10 gate: ${detail.code}`);
    this.name = "MatchGateError";
    this.detail = detail;
  }
}

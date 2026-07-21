/**
 * SPEC-ALIGN-SETUP-001: 정렬(폴리곤 ROI + 방향 화살표 + 좌우 반전) 도메인 타입.
 *
 * `저장 현장 이미지 좌표계`([[x, y], ...]) 좌표 — 백엔드 `alignment_settings` 테이블의
 * polygon/arrow JSON 컬럼과 1:1 대응한다. 이 엔드포인트는 snake_case 필드를 쓰지
 * 않으므로(polygon/arrow/flipHorizontal 세 필드뿐, 백엔드 pydantic 스키마가 이미
 * camelCase alias를 노출 — plan.md §C) 별도 camelCase 변환은 불필요하다.
 *
 * v0.6.0 CHANGE 5(REQ-ALIGN-020): `flipHorizontal`은 **불리언 상태로만** 저장된다 —
 * 좌표를 미리 반전해 저장하지 않는다(이중 반전 방지, H2). 기본값 false이며 null이
 * 될 수 없으므로 REQ-ALIGN-007c의 "정렬 설정됨" 술어에는 포함되지 않는다(무변경).
 */

/** 정렬 좌표 1점 — `저장 현장 이미지 좌표계` 기준 float 좌표(정수 절삭 없음). */
export type AlignmentPoint = [number, number];

/** GET/POST 응답 wire shape. 저장된 적 없으면 polygon/arrow 둘 다 null(REQ-ALIGN-007c 술어).
 * `flipHorizontal`은 DEFAULT가 있는 NOT NULL 불리언이라 항상 boolean이다. */
export interface AlignmentDto {
  polygon: AlignmentPoint[] | null;
  arrow: AlignmentPoint[] | null;
  flipHorizontal?: boolean;
}

/** 앱 모델 — wire shape과 동일(변환 불필요). */
export type Alignment = AlignmentDto;

/** 같은 사건의 "직전 정렬" 응답 — `AlignmentDto`에 출처 신발 모델이 붙는다. */
export interface LatestAlignmentDto extends AlignmentDto {
  /** 이 정렬을 가져온 원본 쌍의 신발 모델(참고용). 저장된 정렬이 없으면 null. */
  modelNumber: string | null;
}

export interface FetchAlignmentInput {
  crimeNumber: string;
  modelNumber: string;
}

export interface SaveAlignmentInput {
  crimeNumber: string;
  modelNumber: string;
  polygon: AlignmentPoint[];
  arrow: AlignmentPoint[];
  /** 좌우 반전 상태(REQ-ALIGN-020c) — 기존 UPSERT 경로에 포함되며 재설정 시 덮어써진다. */
  flipHorizontal: boolean;
}

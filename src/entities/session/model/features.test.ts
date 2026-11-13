import { describe, expect, it } from "vitest";

import { FEATURES, FEATURE_LABELS, FEATURE_ORDER } from "./features";

/**
 * 서버 기능 권한 목록과 어긋나지 않게 지키는 검사.
 * 정본: police-server `auth/entities.py` FEATURE_ORDER(= `app.feature` 초기 행, sort_ordr 순) —
 * `sql/postgres/04_auth.sql` 4개(10~40) + `sql/postgres/migrations/0005_org_role.sql` 8개(50~120).
 * 서버에 기능이 늘면 이 표를 먼저 고치고(실패 확인) 그다음 `features.ts`를 고친다.
 */
const SERVER_FEATURES: ReadonlyArray<readonly [string, string]> = [
  ["CRIME_REGISTER", "사건 등록"],
  ["CRIME_SEARCH", "사건 조회"],
  ["SHOE_VIEW", "신발 조회"],
  ["SHOE_EDIT", "신발 등록·수정"],
  ["CASE_STATUS_VIEW", "의뢰 진행 상태 조회"],
  ["REPORT_VIEW", "발송된 감정서 조회"],
  ["EXAM_DECIDE", "판정 확정"],
  ["CROSS_REVIEW", "교차 검증"],
  ["REPORT_WRITE", "감정서 작성·제출"],
  ["REPORT_APPROVE", "결재·반려"],
  ["REPORT_SEND", "발송"],
  ["SHOE_COLLECT_REVIEW", "신발 수집 검수"],
];

describe("features — 서버 기능 권한 목록과 같다", () => {
  it("FEATURE_ORDER는 서버 12개 코드와 같은 순서", () => {
    expect(FEATURE_ORDER).toEqual(SERVER_FEATURES.map(([code]) => code));
  });

  it("FEATURES 상수는 코드 = 값이고 FEATURE_ORDER와 같은 집합", () => {
    for (const [key, value] of Object.entries(FEATURES)) expect(key).toBe(value);
    expect(Object.values(FEATURES).sort()).toEqual([...FEATURE_ORDER].sort());
  });

  it("FEATURE_LABELS는 서버 feature_nm 그대로", () => {
    expect(FEATURE_ORDER.map((code) => [code, FEATURE_LABELS[code]])).toEqual(SERVER_FEATURES);
  });
});

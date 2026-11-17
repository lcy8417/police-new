import { describe, expect, it } from "vitest";
import { FEATURES, type SessionUser } from "@/entities/session";
import {
  CASES_ROUTE_FEATURES,
  CASE_VIEW_FEATURES,
  FEATURE_ROUTES,
  firstAllowedPath,
  postLoginPath,
  safeInternalPath,
} from "./feature-routes";

const user = (features: SessionUser["features"], extra: Partial<SessionUser> = {}): SessionUser => ({
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features,
  passwordChangeRequired: false,
  ...extra,
});

describe("FEATURE_ROUTES · firstAllowedPath", () => {
  it("순서는 사건관리(/cases) → 사건 등록 → 사건 조회(옛) → 신발 DB 패널(r2 — /cases 맨 앞)", () => {
    expect(FEATURE_ROUTES.map((r) => r.path)).toEqual(["/cases", "/crimeRegister", "/search", "/cases?shoe=1"]);
    expect(FEATURE_ROUTES[0].codes).toEqual(CASE_VIEW_FEATURES);
  });

  it("사건 보기 권한(진행 상태 · 사건 조회 · 보기 전용) 중 하나면 /cases", () => {
    expect(firstAllowedPath(user([FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW]))).toBe("/cases");
    // 수사관(역할 기본 = 사건 등록 + 진행 상태 조회)도 등록 화면이 아니라 /cases
    expect(firstAllowedPath(user([FEATURES.CRIME_REGISTER, FEATURES.CASE_STATUS_VIEW]))).toBe("/cases");
    // 검증자(보기 전용)
    expect(firstAllowedPath(user([FEATURES.EXAM_VIEW]))).toBe("/cases");
  });

  it("사건 등록만 있으면 옛 등록 화면, 신발 권한만 있으면(분업 담당) /cases?shoe=1", () => {
    expect(firstAllowedPath(user([FEATURES.CRIME_REGISTER]))).toBe("/crimeRegister");
    expect(firstAllowedPath(user([FEATURES.SHOE_VIEW, FEATURES.SHOE_EDIT]))).toBe("/cases?shoe=1");
    expect(firstAllowedPath(user([FEATURES.SHOE_VIEW, FEATURES.SHOE_PATTERN]))).toBe("/cases?shoe=1");
  });

  it("관리자는 첫 메뉴", () => {
    expect(firstAllowedPath(user([], { userSe: "ADMIN" }))).toBe("/cases");
  });

  it("/cases 가드는 사건 보기 권한 + 신발 보기", () => {
    expect(CASES_ROUTE_FEATURES).toEqual([...CASE_VIEW_FEATURES, FEATURES.SHOE_VIEW]);
  });

  it("허용된 화면이 없거나 로그인 전이면 null", () => {
    expect(firstAllowedPath(user([]))).toBeNull();
    expect(firstAllowedPath(null)).toBeNull();
  });
});

describe("safeInternalPath — 로그인 후 돌아갈 주소 검사", () => {
  it("같은 사이트 내부 경로만 허용", () => {
    expect(safeInternalPath("/search/abc?mode=search")).toBe("/search/abc?mode=search");
    expect(safeInternalPath("//evil.example")).toBeNull();
    expect(safeInternalPath("/\\evil.example")).toBeNull();
    expect(safeInternalPath("https://evil.example")).toBeNull();
    expect(safeInternalPath("")).toBeNull();
    expect(safeInternalPath(null)).toBeNull();
  });

  it("로그인 화면으로 되돌아가는 주소는 버린다(반복 방지)", () => {
    expect(safeInternalPath("/login")).toBeNull();
    expect(safeInternalPath("/login?from=%2Fsearch")).toBeNull();
  });
});

describe("postLoginPath", () => {
  it("from이 있으면 그 주소, 없으면 허용된 첫 화면", () => {
    const u = user([FEATURES.CRIME_SEARCH]);
    expect(postLoginPath(u, "?from=%2Fsearch%2Fabc")).toBe("/search/abc");
    expect(postLoginPath(u, "")).toBe("/cases");
    expect(postLoginPath(u, "?from=%2F%2Fevil.example")).toBe("/cases");
  });

  it("비밀번호 변경이 필요하면 /password", () => {
    expect(postLoginPath(user([FEATURES.CRIME_SEARCH], { passwordChangeRequired: true }), "?from=%2Fsearch")).toBe(
      "/password"
    );
  });

  it("허용된 화면이 없으면 / (권한 없음 안내)", () => {
    expect(postLoginPath(user([]), "")).toBe("/");
  });
});

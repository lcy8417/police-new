import { describe, expect, it } from "vitest";
import { FEATURES, type SessionUser } from "@/entities/session";
import { FEATURE_ROUTES, firstAllowedPath, postLoginPath, safeInternalPath } from "./feature-routes";

const user = (features: SessionUser["features"], extra: Partial<SessionUser> = {}): SessionUser => ({
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features,
  passwordChangeRequired: false,
  ...extra,
});

describe("FEATURE_ROUTES · firstAllowedPath", () => {
  it("메뉴 순서는 사건 등록 → 사건 조회 → 신발", () => {
    expect(FEATURE_ROUTES.map((r) => r.path)).toEqual(["/crimeRegister", "/search", "/shoesRepository"]);
  });

  it("허용된 첫 화면을 고른다", () => {
    expect(firstAllowedPath(user([FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW]))).toBe("/search");
    expect(firstAllowedPath(user([FEATURES.SHOE_VIEW, FEATURES.SHOE_EDIT]))).toBe("/shoesRepository");
  });

  it("관리자는 첫 메뉴", () => {
    expect(firstAllowedPath(user([], { userSe: "ADMIN" }))).toBe("/crimeRegister");
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
    expect(postLoginPath(u, "")).toBe("/search");
    expect(postLoginPath(u, "?from=%2F%2Fevil.example")).toBe("/search");
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

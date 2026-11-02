import { beforeEach, describe, expect, it } from "vitest";
import { FEATURES, type SessionUser } from "@/entities/session";
import { hasFeature, useSessionStore } from "./session-store";

const USER: SessionUser = {
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features: [FEATURES.CRIME_SEARCH],
  passwordChangeRequired: false,
};

beforeEach(() => useSessionStore.setState({ user: null, status: "loading" }));

describe("useSessionStore — 로그인 세션 상태", () => {
  it("처음에는 확인 중(loading)이다", () => {
    expect(useSessionStore.getState().status).toBe("loading");
    expect(useSessionStore.getState().user).toBeNull();
  });

  it("setUser면 로그인 상태, clear면 비로그인 상태", () => {
    useSessionStore.getState().setUser(USER);
    expect(useSessionStore.getState()).toMatchObject({ status: "authenticated", user: USER });

    useSessionStore.getState().clear();
    expect(useSessionStore.getState()).toMatchObject({ status: "anonymous", user: null });
  });
});

describe("hasFeature", () => {
  it("사용자는 받은 기능만 허용", () => {
    expect(hasFeature(USER, FEATURES.CRIME_SEARCH)).toBe(true);
    expect(hasFeature(USER, FEATURES.CRIME_REGISTER)).toBe(false);
  });

  it("관리자는 features가 비어 있어도 항상 허용", () => {
    const admin: SessionUser = { ...USER, userSe: "ADMIN", features: [] };
    expect(hasFeature(admin, FEATURES.SHOE_EDIT)).toBe(true);
  });

  it("로그인하지 않았으면 항상 거부", () => {
    expect(hasFeature(null, FEATURES.CRIME_SEARCH)).toBe(false);
  });
});

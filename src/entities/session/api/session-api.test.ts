import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { ApiError, setSessionEndedHandler } from "@/shared/api";
import { changePassword, fetchMe, login, logout } from "./session-api";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  mswServer.resetHandlers();
  setSessionEndedHandler(null);
});
afterAll(() => mswServer.close());

const sessionEnded = vi.fn<(loginUrl: string) => void>();
beforeEach(() => {
  sessionEnded.mockReset();
  setSessionEndedHandler(sessionEnded);
});

/** 서버 `/auth/login`·`/auth/me` 응답(snake). */
const USER_DTO = {
  user_id: "kim01",
  user_nm: "김수사",
  user_se: "USER",
  features: ["CRIME_SEARCH", "SHOE_EDIT", "SHOE_VIEW"],
  password_change_required: false,
};

const USER = {
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features: ["CRIME_SEARCH", "SHOE_EDIT", "SHOE_VIEW"],
  passwordChangeRequired: false,
};

describe("session-api — 로그인·세션 API", () => {
  it("login returns camel user", async () => {
    let body: unknown = null;
    mswServer.use(
      http.post("*/auth/login", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(USER_DTO);
      })
    );

    await expect(login({ userId: "kim01", password: "pass1234!" })).resolves.toEqual(USER);
    expect(body).toEqual({ userId: "kim01", password: "pass1234!" });
  });

  it("로그인 실패(401·423)는 서버 문구를 담은 ApiError, 세션 종료 처리는 하지 않는다", async () => {
    mswServer.use(
      http.post("*/auth/login", () =>
        HttpResponse.json({ detail: "계정이 잠겼습니다. 관리자에게 문의하세요" }, { status: 423 })
      )
    );

    const error = (await login({ userId: "kim01", password: "x" }).catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(423);
    expect(error.detail).toBe("계정이 잠겼습니다. 관리자에게 문의하세요");
    expect(sessionEnded).not.toHaveBeenCalled();
  });

  it("fetchMe returns null on 401", async () => {
    mswServer.use(
      http.get("*/auth/me", () => HttpResponse.json({ detail: "로그인이 필요합니다" }, { status: 401 }))
    );

    await expect(fetchMe()).resolves.toBeNull();
    expect(sessionEnded).not.toHaveBeenCalled();
  });

  it("fetchMe는 로그인 상태면 camel 사용자", async () => {
    mswServer.use(http.get("*/auth/me", () => HttpResponse.json(USER_DTO)));

    await expect(fetchMe()).resolves.toEqual(USER);
  });

  it("logout·changePassword는 정해진 경로와 본문으로 보낸다", async () => {
    let logoutCalled = false;
    let passwordBody: unknown = null;
    mswServer.use(
      http.post("*/auth/logout", () => {
        logoutCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.post("*/auth/password", async ({ request }) => {
        passwordBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      })
    );

    await logout();
    await changePassword({ currentPassword: "old-pass1", newPassword: "new-pass2" });

    expect(logoutCalled).toBe(true);
    expect(passwordBody).toEqual({ currentPassword: "old-pass1", newPassword: "new-pass2" });
  });

  it("비밀번호 변경 400은 서버 문구를 담는다", async () => {
    mswServer.use(
      http.post("*/auth/password", () =>
        HttpResponse.json({ detail: "현재 비밀번호가 올바르지 않습니다" }, { status: 400 })
      )
    );

    const error = (await changePassword({ currentPassword: "a", newPassword: "b" }).catch(
      (e: unknown) => e
    )) as ApiError;

    expect(error.detail).toBe("현재 비밀번호가 올바르지 않습니다");
  });
});

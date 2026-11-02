import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { imageSearch } from "@/services/api";
import {
  backendFetch,
  onForbidden,
  revalidateSession,
  setSessionEndedHandler,
  type ForbiddenInfo,
} from "./backend-fetch";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  mswServer.resetHandlers();
  vi.restoreAllMocks();
  setSessionEndedHandler(null);
  window.history.pushState({}, "", "/");
});
afterAll(() => mswServer.close());

let sessionEnded: ReturnType<typeof vi.fn<(loginUrl: string) => void>>;

beforeEach(() => {
  sessionEnded = vi.fn<(loginUrl: string) => void>();
  setSessionEndedHandler(sessionEnded);
});

describe("backendFetch — 공용 백엔드 요청 함수", () => {
  it("sends credentials include", async () => {
    mswServer.use(http.get("*/crime/", () => HttpResponse.json([])));
    const spy = vi.spyOn(globalThis, "fetch");

    const response = await backendFetch("/crime/");

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toBe("/crime/");
    expect(init?.credentials).toBe("include");
  });

  it("401 does full reload to login with from", async () => {
    window.history.pushState({}, "", "/search/abc");
    mswServer.use(
      http.get("*/crime/", () => HttpResponse.json({ detail: "로그인이 필요합니다" }, { status: 401 }))
    );

    const first = await backendFetch("/crime/");
    await backendFetch("/crime/");

    // 응답은 그대로 돌려주고, 세션 종료 처리(전체 새로고침 이동)는 한 번만 한다.
    expect(first.status).toBe(401);
    expect(sessionEnded).toHaveBeenCalledTimes(1);
    expect(sessionEnded).toHaveBeenCalledWith("/login?from=%2Fsearch%2Fabc");
  });

  it("does not end session for /auth/me", async () => {
    mswServer.use(
      http.get("*/auth/me", () => HttpResponse.json({ detail: "로그인이 필요합니다" }, { status: 401 })),
      http.post("*/auth/login", () =>
        HttpResponse.json({ detail: "아이디 또는 비밀번호가 올바르지 않습니다" }, { status: 401 })
      )
    );

    const me = await backendFetch("/auth/me");
    const login = await backendFetch("/auth/login", { method: "POST" });

    expect(me.status).toBe(401);
    expect(login.status).toBe(401);
    expect(sessionEnded).not.toHaveBeenCalled();
  });

  it("image api 401 ends session", async () => {
    window.history.pushState({}, "", "/search/05019-24-0017_5?mode=search");
    mswServer.use(
      http.post("*/crime/:id/search", () =>
        HttpResponse.json({ detail: "로그인이 필요합니다" }, { status: 401 })
      )
    );

    await expect(
      imageSearch({ aprthngNo: "05019-24-0017_5", body: { top: [], mid: [], bottom: [], outline: [] } })
    ).rejects.toThrow();

    expect(sessionEnded).toHaveBeenCalledTimes(1);
    expect(sessionEnded).toHaveBeenCalledWith(
      `/login?from=${encodeURIComponent("/search/05019-24-0017_5?mode=search")}`
    );
  });

  it("403 emits forbidden and preserves body", async () => {
    mswServer.use(
      http.get("*/shoes/", () => HttpResponse.json({ detail: "접근 권한이 없습니다" }, { status: 403 }))
    );
    const received: ForbiddenInfo[] = [];
    const unsubscribe = onForbidden((info) => received.push(info));

    const response = await backendFetch("/shoes/?page=0");
    unsubscribe();
    await backendFetch("/shoes/?page=0");

    expect(received).toEqual([{ status: 403, detail: "접근 권한이 없습니다" }]);
    // 이벤트를 위해 본문을 읽었어도 호출부는 원래 응답 본문을 그대로 읽을 수 있다.
    await expect(response.json()).resolves.toEqual({ detail: "접근 권한이 없습니다" });
    expect(sessionEnded).not.toHaveBeenCalled();
  });

  it("rejects absolute path", async () => {
    await expect(backendFetch("https://evil.example/crime/")).rejects.toThrow(Error);
    await expect(backendFetch("//evil.example/crime/")).rejects.toThrow(Error);
    await expect(backendFetch("crime/")).rejects.toThrow(Error);
  });
});

describe("revalidateSession — 보호된 이미지 실패 시 세션 재확인", () => {
  it("revalidateSession dedupes", async () => {
    window.history.pushState({}, "", "/shoesRepository");
    let calls = 0;
    mswServer.use(
      http.get("*/auth/me", () => {
        calls += 1;
        return HttpResponse.json({ detail: "로그인이 필요합니다" }, { status: 401 });
      })
    );

    const a = revalidateSession();
    const b = revalidateSession();
    expect(b).toBe(a);
    await Promise.all([a, b]);

    expect(calls).toBe(1);
    expect(sessionEnded).toHaveBeenCalledTimes(1);
    expect(sessionEnded).toHaveBeenCalledWith("/login?from=%2FshoesRepository");
  });

  it("세션이 살아 있으면(200) 아무 일도 하지 않는다", async () => {
    mswServer.use(
      http.get("*/auth/me", () =>
        HttpResponse.json({
          user_id: "kim01",
          user_nm: "김수사",
          user_se: "USER",
          features: ["CRIME_SEARCH"],
          password_change_required: false,
        })
      )
    );

    await revalidateSession();

    expect(sessionEnded).not.toHaveBeenCalled();
  });
});

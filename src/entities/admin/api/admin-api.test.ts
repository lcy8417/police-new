import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import {
  createUser,
  fetchActions,
  fetchEvents,
  fetchFeatures,
  fetchSessionEvents,
  fetchSessions,
  fetchUsers,
  replaceUserFeatures,
  resetPassword,
  unlockUser,
  updateUser,
} from "./admin-api";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

const EVENT_DTO = {
  log_id: 11,
  session_id: "7d3c1d1e-0000-4000-8000-000000000001",
  user_id: "kim01",
  user_nm: "김수사",
  occurred_dt: "2026-11-03T09:10:00+09:00",
  action_code: "SHOE_SEARCH",
  action_nm: "신발 검색",
  feature_code: "CRIME_SEARCH",
  target_id: "05019-24-0017_5",
  result: "FAIL",
  status_code: 500,
  error_code: "INTERNAL_ERROR",
  error_msg: "서버 내부 오류",
  duration_ms: 120,
};

describe("admin-api — 관리자 API", () => {
  it("fetchUsers는 camel 사용자 목록", async () => {
    mswServer.use(
      http.get("*/admin/users", () =>
        HttpResponse.json([
          {
            user_id: "kim01",
            user_nm: "김수사",
            user_se: "USER",
            use_at: "Y",
            lock_at: "N",
            features: ["CRIME_REGISTER"],
            last_login_dt: null,
          },
        ])
      )
    );

    await expect(fetchUsers()).resolves.toEqual([
      {
        userId: "kim01",
        userNm: "김수사",
        userSe: "USER",
        useAt: "Y",
        lockAt: "N",
        features: ["CRIME_REGISTER"],
        lastLoginDt: null,
      },
    ]);
  });

  it("fetchSessions passes filters as query", async () => {
    let search: URLSearchParams | null = null;
    mswServer.use(
      http.get("*/admin/sessions", ({ request }) => {
        search = new URL(request.url).searchParams;
        return HttpResponse.json([
          {
            session_id: "s-1",
            user_id: "kim01",
            user_nm: "김수사",
            login_dt: "2026-11-03T09:00:00+09:00",
            logout_dt: null,
            logout_reason: null,
            ip_addr: "10.0.0.5",
            event_cnt: 4,
            fail_cnt: 1,
          },
        ]);
      })
    );

    const rows = await fetchSessions({ userId: "kim01", from: "2026-10-28", to: "2026-11-03", page: 2 });

    expect(search).not.toBeNull();
    const params = search as unknown as URLSearchParams;
    expect(params.get("user_id")).toBe("kim01");
    expect(params.get("from")).toBe("2026-10-28");
    expect(params.get("to")).toBe("2026-11-03");
    expect(params.get("page")).toBe("2");
    expect(rows[0]).toMatchObject({ sessionId: "s-1", eventCnt: 4, failCnt: 1, logoutDt: null });
  });

  it("비어 있는 필터는 쿼리에 넣지 않는다", async () => {
    let query = "?unset";
    mswServer.use(
      http.get("*/admin/sessions", ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json([]);
      })
    );

    await fetchSessions({ userId: "", from: undefined });

    expect(query).toBe("");
  });

  it("fetchEvents는 result·action_code 필터를 snake 쿼리로", async () => {
    let search: URLSearchParams | null = null;
    mswServer.use(
      http.get("*/admin/events", ({ request }) => {
        search = new URL(request.url).searchParams;
        return HttpResponse.json([EVENT_DTO]);
      })
    );

    const rows = await fetchEvents({ result: "FAIL", actionCode: "SHOE_SEARCH", page: 0 });

    const params = search as unknown as URLSearchParams;
    expect(params.get("result")).toBe("FAIL");
    expect(params.get("action_code")).toBe("SHOE_SEARCH");
    expect(params.get("page")).toBe("0");
    expect(rows[0]).toMatchObject({ logId: 11, actionNm: "신발 검색", errorMsg: "서버 내부 오류" });
  });

  it("fetchSessionEvents는 세션 번호 경로", async () => {
    let path = "";
    mswServer.use(
      http.get("*/admin/sessions/:id/events", ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json([EVENT_DTO]);
      })
    );

    const rows = await fetchSessionEvents("s-1");

    expect(path).toBe("/admin/sessions/s-1/events");
    expect(rows[0].targetId).toBe("05019-24-0017_5");
  });

  it("replaceUserFeatures sends features array", async () => {
    let body: unknown = null;
    mswServer.use(
      http.put("*/admin/users/:id/features", async ({ request, params }) => {
        expect(params.id).toBe("kim01");
        body = await request.json();
        return HttpResponse.json({});
      })
    );

    await replaceUserFeatures("kim01", ["CRIME_REGISTER", "SHOE_EDIT"]);

    expect(body).toEqual({ features: ["CRIME_REGISTER", "SHOE_EDIT"] });
  });

  it("createUser·updateUser·resetPassword·unlockUser 본문과 경로", async () => {
    const seen: Array<{ method: string; path: string; body: unknown }> = [];
    const record = async ({ request }: { request: Request }) => {
      const text = await request.text();
      seen.push({
        method: request.method,
        path: new URL(request.url).pathname,
        body: text ? JSON.parse(text) : null,
      });
      return new HttpResponse(null, { status: 204 });
    };
    mswServer.use(
      http.post("*/admin/users", record),
      http.put("*/admin/users/:id", record),
      http.post("*/admin/users/:id/password-reset", record),
      http.post("*/admin/users/:id/unlock", record)
    );

    await createUser({
      userId: "lee02",
      userNm: "이감정",
      userSe: "USER",
      initialPassword: "temp-pass1",
      features: ["CRIME_SEARCH"],
    });
    await updateUser("lee02", { userNm: "이감정", userSe: "USER", useAt: "N" });
    await resetPassword("lee02", "temp-pass2");
    await unlockUser("lee02");

    expect(seen).toEqual([
      {
        method: "POST",
        path: "/admin/users",
        body: {
          userId: "lee02",
          userNm: "이감정",
          userSe: "USER",
          initialPassword: "temp-pass1",
          features: ["CRIME_SEARCH"],
        },
      },
      { method: "PUT", path: "/admin/users/lee02", body: { userNm: "이감정", userSe: "USER", useAt: "N" } },
      { method: "POST", path: "/admin/users/lee02/password-reset", body: { tempPassword: "temp-pass2" } },
      { method: "POST", path: "/admin/users/lee02/unlock", body: null },
    ]);
  });

  it("fetchFeatures·fetchActions는 camel 목록", async () => {
    mswServer.use(
      http.get("*/admin/features", () =>
        HttpResponse.json([{ feature_code: "CRIME_REGISTER", feature_nm: "사건 등록", sort_ordr: 1 }])
      ),
      http.get("*/admin/actions", () =>
        HttpResponse.json([{ action_code: "AUTH_LOGIN", action_nm: "로그인" }])
      )
    );

    await expect(fetchFeatures()).resolves.toEqual([
      { featureCode: "CRIME_REGISTER", featureNm: "사건 등록", sortOrdr: 1 },
    ]);
    await expect(fetchActions()).resolves.toEqual([{ actionCode: "AUTH_LOGIN", actionNm: "로그인" }]);
  });
});

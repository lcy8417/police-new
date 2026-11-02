import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { ApiError, apiGet, apiSend } from "./client";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe("ApiError — 서버 detail 문구 전달", () => {
  it("throws ApiError with server detail on 409", async () => {
    mswServer.use(
      http.post("*/crime/register", () =>
        HttpResponse.json({ detail: "이미 등록된 번호입니다" }, { status: 409 })
      )
    );

    const error = await apiSend("/crime/register", "POST", {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).detail).toBe("이미 등록된 번호입니다");
    // 토스트(query-client)는 message를 쓰므로 message에도 같은 문구가 들어간다.
    expect((error as ApiError).message).toBe("이미 등록된 번호입니다");
  });

  it("400 검증 실패의 detail도 그대로 담는다(apiGet)", async () => {
    mswServer.use(
      http.get("*/shoes/a.b", () =>
        HttpResponse.json({ detail: "번호는 영문·숫자·-·_만 쓸 수 있습니다" }, { status: 400 })
      )
    );

    const error = await apiGet("/shoes/a.b").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).detail).toBe("번호는 영문·숫자·-·_만 쓸 수 있습니다");
  });

  it("400·409가 아니거나 detail이 문자열이 아니면 기본 문구를 쓰고 detail은 null", async () => {
    mswServer.use(
      http.get("*/shoes/missing", () =>
        HttpResponse.json({ detail: "Not Found" }, { status: 404 })
      ),
      http.post("*/crime/x/match", () =>
        HttpResponse.json({ detail: [{ msg: "field required" }] }, { status: 400 })
      )
    );

    const notFound = (await apiGet("/shoes/missing").catch((e: unknown) => e)) as ApiError;
    expect(notFound.status).toBe(404);
    expect(notFound.detail).toBeNull();
    expect(notFound.message).toBe("서버 요청에 실패했습니다");

    const nonString = (await apiSend("/crime/x/match", "POST").catch((e: unknown) => e)) as ApiError;
    expect(nonString.status).toBe(400);
    expect(nonString.detail).toBeNull();
  });

  it("본문이 JSON이 아니어도 ApiError를 던진다", async () => {
    mswServer.use(
      http.post("*/crime/broken", () => new HttpResponse("oops", { status: 409 }))
    );

    const error = (await apiSend("/crime/broken", "POST").catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.detail).toBeNull();
  });
});

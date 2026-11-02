import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { fetchCrimeData, fetchShoesData } from "./crud.js";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe("services/crud.js — 레거시 목록 호출", () => {
  it("list paths have trailing slash", async () => {
    const paths: string[] = [];
    mswServer.use(
      http.get("*/crime/", ({ request }) => {
        const url = new URL(request.url);
        paths.push(url.pathname + url.search);
        return HttpResponse.json([]);
      }),
      http.get("*/shoes/", ({ request }) => {
        const url = new URL(request.url);
        paths.push(url.pathname + url.search);
        return HttpResponse.json([]);
      })
    );

    await fetchCrimeData();
    await fetchShoesData(0);

    // 끝 `/`를 빼면 서버가 리다이렉트하며 중계 환경에서 scheme이 틀어진다(설계서 §3-1).
    expect(paths).toEqual(["/crime/", "/shoes/?page=0"]);
  });
});

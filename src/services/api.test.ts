import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";

// services/api.js는 모듈을 불러올 때 VITE_API_URL을 읽는다 — 환경변수를 먼저 넣고 동적 import한다.
const API_URL = "http://api.test";
const APRTHNG_NO = "05019-24-0017_5";
const ENCODED = encodeURIComponent(APRTHNG_NO);

let api: typeof import("./api.js");

beforeAll(async () => {
  vi.stubEnv("VITE_API_URL", API_URL);
  api = await import("./api.js");
  mswServer.listen({ onUnhandledRequest: "error" });
});
afterEach(() => mswServer.resetHandlers());
afterAll(() => {
  mswServer.close();
  vi.unstubAllEnvs();
});

describe("services/api.js — 이미지 처리 API의 사건 ID(aprthngNo)", () => {
  it("imageLoad uses aprthngNo in URL", async () => {
    let capturedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/crime/:id/image_load`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ image: "data:image/png;base64,AAAA" });
      })
    );

    const image = await api.imageLoad({ aprthngNo: APRTHNG_NO, edit: false });

    expect(image).toBe("data:image/png;base64,AAAA");
    expect(capturedUrl).toBe(`${API_URL}/crime/${ENCODED}/image_load?edit=false`);
    expect(capturedUrl).not.toContain("undefined");
  });

  it("patternsExtract uses aprthngNo in URL", async () => {
    let capturedUrl = "";
    mswServer.use(
      http.post(`${API_URL}/crime/:id/patterns_extract`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([{ code: "s21b", score: 0.9 }]);
      })
    );

    const result = await api.patternsExtract({
      aprthngNo: APRTHNG_NO,
      body: { image: "AAAA", line_ys: [10, 20], render_size: [100, 200], type: "crime" },
    });

    expect(result).toEqual({ extracted: [{ code: "s21b", score: 0.9 }] });
    expect(capturedUrl).toBe(`${API_URL}/crime/${ENCODED}/patterns_extract`);
    expect(capturedUrl).not.toContain("undefined");
  });

  it("imageSearch maps ftwr_id — 결과를 ftwrId·image URL·similarity로 바꾼다", async () => {
    let capturedUrl = "";
    mswServer.use(
      http.post(`${API_URL}/crime/:id/search`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          result: [
            { ftwr_id: "00758", similarity: 69.99 },
            { ftwr_id: "A-1", similarity: 50 },
          ],
          total: 2,
        });
      })
    );

    const { result, total } = await api.imageSearch({
      aprthngNo: APRTHNG_NO,
      body: { image: "AAAA", top: [], mid: [], bottom: [], outline: [] },
      page: 0,
      binary: "이진화보기",
    });

    expect(capturedUrl).toContain(`/crime/${ENCODED}/search?`);
    expect(capturedUrl).not.toContain("undefined");
    expect(total).toBe(2);
    expect(result).toEqual([
      { ftwrId: "00758", image: `${API_URL}/shoes_images/B/00758.png`, similarity: 69.99 },
      { ftwrId: "A-1", image: `${API_URL}/shoes_images/B/A-1.png`, similarity: 50 },
    ]);
    expect(result[0]).not.toHaveProperty("shoesName");
  });

  it("imageSearch는 원본 보기에서 Shoerinsics 폴더를 쓴다", async () => {
    mswServer.use(
      http.post(`${API_URL}/crime/:id/search`, () =>
        HttpResponse.json({ result: [{ ftwr_id: "00758", similarity: 10 }], total: 1 })
      )
    );

    const { result } = await api.imageSearch({ aprthngNo: APRTHNG_NO, body: {} });

    expect(result[0].image).toBe(`${API_URL}/shoes_images/Shoerinsics/00758.png`);
  });

  it("imageProcessing uses aprthngNo in URL", async () => {
    let capturedUrl = "";
    mswServer.use(
      http.post(`${API_URL}/crime/:id/binarization`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ image: "BIN" });
      })
    );

    // body 인자는 JS 기본값(null)에서 타입이 추론돼 TS 테스트에서는 생략한다(URL만 검증).
    const image = await api.imageProcessing(APRTHNG_NO, "binarization");

    expect(image).toBe("BIN");
    expect(capturedUrl).toBe(`${API_URL}/crime/${ENCODED}/binarization`);
  });

  it("fetchSimilarity sends ftwr_id query", async () => {
    let capturedUrl = "";
    mswServer.use(
      http.post(`${API_URL}/crime/:id/similarity`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ matches: [] });
      })
    );

    await api.fetchSimilarity({ aprthngNo: APRTHNG_NO, ftwrId: "00758" });

    const parsed = new URL(capturedUrl);
    expect(parsed.pathname).toBe(`/crime/${ENCODED}/similarity`);
    expect(parsed.searchParams.get("ftwr_id")).toBe("00758");
    expect(parsed.searchParams.has("model_number")).toBe(false);
  });
});

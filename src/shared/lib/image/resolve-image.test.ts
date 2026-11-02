import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { resolveImageToDataUrl } from "./resolve-image";

/** 1x1 PNG 바이트 일부 — 내용은 상관없고 base64로 그대로 옮겨지는지만 본다. */
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_BASE64 = "iVBORw0KGgo=";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  mswServer.resetHandlers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
afterAll(() => mswServer.close());

function pngResponse() {
  return new HttpResponse(PNG_BYTES, { headers: { "Content-Type": "image/png" } });
}

describe("resolveImageToDataUrl — 서버 이미지를 data URL로", () => {
  it("loads root-relative and configured absolute", async () => {
    mswServer.use(
      http.get("*/crime_images/a.png", pngResponse),
      http.get("https://srv:8000/shoes_images/B/00758.png", pngResponse)
    );
    const spy = vi.spyOn(globalThis, "fetch");

    // 1) 루트 기준 상대 경로(중계)
    vi.stubEnv("VITE_API_URL", "");
    await expect(resolveImageToDataUrl("/crime_images/a.png")).resolves.toBe(
      `data:image/png;base64,${PNG_BASE64}`
    );

    // 2) VITE_API_URL로 시작하는 절대 주소(주소 분리)
    vi.stubEnv("VITE_API_URL", "https://srv:8000");
    await expect(
      resolveImageToDataUrl("https://srv:8000/shoes_images/B/00758.png")
    ).resolves.toBe(`data:image/png;base64,${PNG_BASE64}`);

    // 둘 다 공용 요청 함수(쿠키 포함)를 거친다.
    expect(spy).toHaveBeenCalledTimes(2);
    for (const [, init] of spy.mock.calls) {
      expect(init?.credentials).toBe("include");
    }
    expect(String(spy.mock.calls[1][0])).toBe("https://srv:8000/shoes_images/B/00758.png");
  });

  it("keeps data url", async () => {
    await expect(resolveImageToDataUrl("data:image/png;base64,AAAA")).resolves.toBe(
      "data:image/png;base64,AAAA"
    );
    // 접두어 없는 순수 base64는 접두어만 붙인다.
    await expect(resolveImageToDataUrl("AAAA")).resolves.toBe("data:image/png;base64,AAAA");
  });

  it("실패 응답이면 예외를 던진다", async () => {
    mswServer.use(http.get("*/crime_images/missing.png", () => new HttpResponse(null, { status: 404 })));

    await expect(resolveImageToDataUrl("/crime_images/missing.png")).rejects.toThrow(
      "이미지 로드 실패: 404"
    );
  });
});

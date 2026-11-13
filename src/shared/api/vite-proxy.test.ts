// @vitest-environment node
// vite.config.js는 Node에서 도는 설정 파일이다(esbuild가 jsdom의 TextEncoder를 거부) — node 환경에서 검사한다.
import { describe, expect, it } from "vitest";
import { BACKEND_PROXY_PATTERN, BACKEND_STATIC_PREFIXES, backendProxy } from "../../../vite.config.js";

const matchesApi = (path: string) => new RegExp(BACKEND_PROXY_PATTERN).test(path);

describe("vite.config.js 중계(proxy) 규칙 — 같은 주소(same-origin)", () => {
  it("API 경로는 백엔드로 넘긴다", () => {
    expect(matchesApi("/crime/abc")).toBe(true);
    expect(matchesApi("/crime?x=1")).toBe(true);
    expect(matchesApi("/crime/")).toBe(true);
    expect(matchesApi("/shoes/?page=0")).toBe(true);
    expect(matchesApi("/auth/me")).toBe(true);
    expect(matchesApi("/admin/users")).toBe(true);
  });

  it("증거 파일 API(/files)도 넘긴다 — 원본 올리기 POST · 파일 열람 GET", () => {
    expect(matchesApi("/files/original")).toBe(true);
    expect(matchesApi("/files/42")).toBe(true);
    // 같은 글자로 시작하는 화면 주소는 넘기지 않는다.
    expect(matchesApi("/filesView")).toBe(false);
  });

  it("화면 주소는 넘기지 않는다", () => {
    expect(matchesApi("/crimeRegister")).toBe(false);
    expect(matchesApi("/search/abc")).toBe(false);
    expect(matchesApi("/shoesRepository")).toBe(false);
    expect(matchesApi("/manage/users")).toBe(false);
    expect(matchesApi("/login")).toBe(false);
  });

  it("정적 이미지 폴더 4개와 API 규칙을 같은 대상·옵션으로 묶는다", () => {
    expect(BACKEND_STATIC_PREFIXES).toEqual([
      "/crime_images/",
      "/crime_history/",
      "/crime_outlines/",
      "/shoes_images/",
    ]);
    const proxy = backendProxy("https://localhost:8000");
    expect(Object.keys(proxy)).toEqual([BACKEND_PROXY_PATTERN, ...BACKEND_STATIC_PREFIXES]);
    for (const options of Object.values(proxy)) {
      expect(options).toEqual({ target: "https://localhost:8000", secure: false, changeOrigin: false });
    }
  });
});

import { describe, it, expect } from "vitest";
import { findExternalUrls, isExcludedSource } from "../../../scripts/ui/check-no-external.mjs";

// 내부망 대응 외부 주소 검사(scripts/ui/check-no-external.mjs)의 판정 로직.
describe("findExternalUrls — 외부 주소 판정", () => {
  it("Google Fonts 링크는 잡는다(예전 index.html)", () => {
    const html = [
      "<head>",
      '<link rel="preconnect" href="https://fonts.googleapis.com" />',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR&display=swap" />',
      "</head>",
    ].join("\n");
    const found = findExternalUrls({ text: html, scope: "source" });
    expect(found.map((f) => f.line)).toEqual([2, 3]);
    expect(found[0].url).toBe("https://fonts.googleapis.com");
  });

  it("CSS @import · 프로토콜 생략 주소도 잡는다", () => {
    const css = '@import url("https://cdn.example.com/a.css");\n.x { background: url(//cdn.example.com/b.png); }';
    expect(findExternalUrls({ text: css, scope: "source" }).map((f) => f.url)).toEqual([
      "https://cdn.example.com/a.css",
      "//cdn.example.com/b.png",
    ]);
    expect(findExternalUrls({ text: '<script src="//cdn.example.com/x.js"></script>', scope: "dist" })).toHaveLength(1);
  });

  it("XML 이름공간 · 자기 PC 주소 · 상대 경로는 통과", () => {
    const text = [
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>',
      'const base = "http://localhost"; const t = "https://127.0.0.1:8000";',
      'src: url("./assets/fonts/ibm-plex-sans-kr/IBMPlexSansKR-Regular.woff2")',
    ].join("\n");
    expect(findExternalUrls({ text, scope: "source" })).toEqual([]);
  });

  it("라이브러리 안내 문구는 dist 에서만 허용(소스에 쓰면 실패)", () => {
    const text = 'var l="https://react.dev/errors/"+a; /*! tailwindcss v4 | MIT License | https://tailwindcss.com */';
    expect(findExternalUrls({ text, scope: "dist" })).toEqual([]);
    expect(findExternalUrls({ text, scope: "source" })).toHaveLength(2);
  });

  it("허용 목록 호스트와 앞부분만 같은 주소는 잡는다", () => {
    expect(findExternalUrls({ text: "https://tailwindcss.com/cdn.js", scope: "dist" })).toHaveLength(1);
    expect(findExternalUrls({ text: "https://localhost.evil.example/x", scope: "dist" })).toHaveLength(1);
  });
});

describe("isExcludedSource — 검사에서 빼는 소스", () => {
  it("테스트 파일 · 테스트 준비 폴더 · 글꼴 라이선스는 뺀다", () => {
    expect(isExcludedSource("src/shared/api/media-url.test.ts")).toBe(true);
    expect(isExcludedSource("src/pages/x/X.spec.tsx")).toBe(true);
    expect(isExcludedSource("src/test/setup.ts")).toBe(true);
    expect(isExcludedSource("src/assets/fonts/jetbrains-mono/OFL.txt")).toBe(true);
  });

  it("화면 코드 · CSS 는 본다", () => {
    expect(isExcludedSource("src/index.css")).toBe(false);
    expect(isExcludedSource("src/shared/api/media-url.ts")).toBe(false);
  });
});

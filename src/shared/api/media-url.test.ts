import { afterEach, describe, expect, it, vi } from "vitest";
import { backendMediaUrl, crimeHistoryPath, toBackendPath } from "./media-url";

describe("crimeHistoryPath — 편집본 저장 응답의 image_path 확인", () => {
  it("/crime_history/ 아래 파일 경로만 통과", () => {
    expect(crimeHistoryPath("/crime_history/00001-23-0360_crime_x.png")).toBe(
      "/crime_history/00001-23-0360_crime_x.png"
    );
  });

  it("다른 폴더·상위 폴더 이동·절대 주소·빈 값은 거부", () => {
    expect(crimeHistoryPath("/crime_images/a.png")).toBeNull();
    expect(crimeHistoryPath("/crime_history/../crime_images/a.png")).toBeNull();
    expect(crimeHistoryPath("/crime_history/a/b.png")).toBeNull();
    expect(crimeHistoryPath("/crime_history/")).toBeNull();
    expect(crimeHistoryPath("https://evil.example/crime_history/a.png")).toBeNull();
    expect(crimeHistoryPath(null)).toBeNull();
    expect(crimeHistoryPath(undefined)).toBeNull();
    expect(crimeHistoryPath(42)).toBeNull();
  });
});

afterEach(() => vi.unstubAllEnvs());

describe("backendMediaUrl — 서버 이미지 경로에 VITE_API_URL 붙이기", () => {
  it("prefixes VITE_API_URL", () => {
    vi.stubEnv("VITE_API_URL", "https://srv:8000");
    expect(backendMediaUrl("/crime_images/a.png")).toBe("https://srv:8000/crime_images/a.png");

    // 중계(빈 값)면 루트 기준 상대 경로 그대로.
    vi.stubEnv("VITE_API_URL", "");
    expect(backendMediaUrl("/crime_images/a.png")).toBe("/crime_images/a.png");
  });

  it("이미 절대 주소·data URL이면 그대로 둔다(서버 전환 전후 모두 동작)", () => {
    vi.stubEnv("VITE_API_URL", "https://srv:8000");
    expect(backendMediaUrl("https://srv:8000/shoes_images/B/00758.png")).toBe(
      "https://srv:8000/shoes_images/B/00758.png"
    );
    expect(backendMediaUrl("http://other:8000/x.png")).toBe("http://other:8000/x.png");
    expect(backendMediaUrl("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });

  it("null stays null", () => {
    vi.stubEnv("VITE_API_URL", "https://srv:8000");
    expect(backendMediaUrl(null)).toBeNull();
    expect(backendMediaUrl(undefined)).toBeNull();
  });
});

describe("toBackendPath — 이미지 주소를 backendFetch용 경로로", () => {
  it("toBackendPath handles relative, configured absolute, foreign", () => {
    // 1) 중계(빈 VITE_API_URL)
    vi.stubEnv("VITE_API_URL", "");
    expect(toBackendPath("/crime_images/a.png")).toBe("/crime_images/a.png");
    expect(toBackendPath("https://other.example/x.png")).toBeNull();
    expect(toBackendPath("//other.example/x.png")).toBeNull();
    // 같은 주소(프론트 origin)의 절대 주소는 경로만 남긴다.
    expect(toBackendPath(`${window.location.origin}/crime_history/a.png?v=1`)).toBe(
      "/crime_history/a.png?v=1"
    );

    // 2) 주소 분리(VITE_API_URL=https://srv:8000)
    vi.stubEnv("VITE_API_URL", "https://srv:8000");
    expect(toBackendPath("/crime_images/a.png")).toBe("/crime_images/a.png");
    expect(toBackendPath("https://srv:8000/shoes_images/B/00758.png?cors=1")).toBe(
      "/shoes_images/B/00758.png?cors=1"
    );
    expect(toBackendPath("https://srv:80001/x.png")).toBeNull();
    expect(toBackendPath("https://other.example/x.png")).toBeNull();
  });
});

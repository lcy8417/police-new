import { describe, it, expect } from "vitest";
import { countHex } from "./hex-count";

describe("countHex — 소스 안의 hex 색 개수", () => {
  it("따옴표 안·밖의 색을 모두 센다", () => {
    expect(countHex('a "#1E2A3C" b #fff')).toBe(2);
  });

  it("`// hex-ok`로 끝나는 줄은 세지 않는다(앵커 링크 등)", () => {
    expect(countHex('href="#face" // hex-ok')).toBe(0);
  });

  it("`// hex-ok`가 없는 줄은 계속 센다", () => {
    expect(countHex('a="#fff" // hex-ok\nb="#000"')).toBe(1);
  });

  it("5자리는 색이 아니다", () => {
    expect(countHex("#12345")).toBe(0);
  });

  it("8자리(알파 포함)는 1곳으로 센다", () => {
    expect(countHex("#1e2a3cff")).toBe(1);
  });
});

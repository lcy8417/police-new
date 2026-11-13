import { describe, it, expect } from "vitest";
import { countHex, HEX_PATTERN } from "./hex-count";
import { countHex as countHexMjs, HEX_PATTERN as HEX_PATTERN_MJS } from "../../../scripts/ui/count-hex.mjs";

describe("count-hex.mjs 복제본이 hex-count.ts 와 같다", () => {
  it("정규식 source·flags 가 같다", () => {
    expect(HEX_PATTERN_MJS.source).toBe(HEX_PATTERN.source);
    expect(HEX_PATTERN_MJS.flags).toBe(HEX_PATTERN.flags);
  });

  it.each([
    'a "#1E2A3C" b #fff', // hex-ok
    'href="#face" // hex-ok', // hex-ok
    'a="#fff" // hex-ok\nb="#000"', // hex-ok
    "#12345", // hex-ok
    "#1e2a3cff", // hex-ok
    "#abcd #abcde #abcdef", // hex-ok
  ])("결과가 같다: %s", (src) => {
    expect(countHexMjs(src)).toBe(countHex(src));
  });
});

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

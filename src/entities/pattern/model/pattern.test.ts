import { describe, it, expect } from "vitest";
import {
  PATTERNS_ROOT,
  insertPatternPath,
  stripPatternPath,
} from "./pattern";

describe("pattern codec", () => {
  it("inserts the root for a shoe bare-name string", () => {
    expect(insertPatternPath("무늬1")).toBe(`${PATTERNS_ROOT}무늬1.png`);
  });

  it("inserts the root for a crime tuple, preserving the essential flag", () => {
    expect(insertPatternPath(["무늬1", 0])).toEqual([
      `${PATTERNS_ROOT}무늬1.png`,
      0,
    ]);
    expect(insertPatternPath(["무늬1", true])).toEqual([
      `${PATTERNS_ROOT}무늬1.png`,
      true,
    ]);
  });

  it("strips a shoe path back to a bare name", () => {
    expect(stripPatternPath(`${PATTERNS_ROOT}삼각2.png`)).toBe("삼각2");
  });

  it("strips a crime tuple, passing the 0 sentinel through UNCHANGED", () => {
    // The untoggled essential flag is the number 0 and must reach the wire as 0,
    // not coerced to false — this is the crown-jewel invariant.
    expect(stripPatternPath([`${PATTERNS_ROOT}원3.png`, 0])).toEqual(["원3", 0]);
    expect(stripPatternPath([`${PATTERNS_ROOT}원3.png`, true])).toEqual([
      "원3",
      true,
    ]);
  });

  it("round-trips both variants", () => {
    expect(stripPatternPath(insertPatternPath("사각4"))).toBe("사각4");
    expect(stripPatternPath(insertPatternPath(["선5", 0]))).toEqual(["선5", 0]);
  });
});

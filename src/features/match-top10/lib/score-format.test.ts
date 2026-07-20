import { describe, expect, it } from "vitest";
import { matchScoreToDisplayPercent } from "./score-format";

describe("matchScoreToDisplayPercent [WATCH: 0-1 cosine vs 0-100 percent collision]", () => {
  it("converts the mutual-NN threshold (0.45) to 45%, not 0.45% (no double-division)", () => {
    expect(matchScoreToDisplayPercent(0.45)).toBe(45);
  });

  it("converts a mid-range score (0.72) to 72%", () => {
    expect(matchScoreToDisplayPercent(0.72)).toBe(72);
  });

  it("converts near-perfect score (0.999) to 100% (rounded)", () => {
    expect(matchScoreToDisplayPercent(0.999)).toBe(100);
  });

  it("clamps a legacy-scale value (>1, e.g. a search API percent) via /100 exactly once", () => {
    // 방어적 케이스: 코사인 도메인이 아닌 값이 실수로 들어와도 RetrievalResultsGrid의
    // 규칙과 동일하게 1회만 나눈다(이중 나눗셈 금지).
    expect(matchScoreToDisplayPercent(72)).toBe(72);
  });

  it("never divides an already-fractional score a second time", () => {
    const values = [0, 0.01, 0.45, 0.5, 0.8, 1.0];
    for (const v of values) {
      expect(matchScoreToDisplayPercent(v)).toBe(Math.round(v * 100));
    }
  });
});

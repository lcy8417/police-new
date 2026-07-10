import { describe, it, expect } from "vitest";
import { toKstIso } from "./kst";

describe("toKstIso", () => {
  it("shifts the instant by +9h and suffixes +09:00", () => {
    expect(toKstIso(new Date("2024-01-01T00:00:00.000Z"))).toBe(
      "2024-01-01T09:00:00.000+09:00"
    );
  });

  it("carries across a day boundary", () => {
    expect(toKstIso(new Date("2024-01-01T20:00:00.000Z"))).toBe(
      "2024-01-02T05:00:00.000+09:00"
    );
  });
});

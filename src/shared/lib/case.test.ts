import { describe, it, expect } from "vitest";
import { convertKeysToCamelCase } from "./case";

describe("convertKeysToCamelCase", () => {
  it("converts snake_case keys to camelCase", () => {
    expect(
      convertKeysToCamelCase({ crime_number: "1", register_time: "t" })
    ).toEqual({ crimeNumber: "1", registerTime: "t" });
  });

  it("recurses into arrays and nested objects", () => {
    expect(convertKeysToCamelCase({ a_b: [{ c_d: 1 }] })).toEqual({
      aB: [{ cD: 1 }],
    });
  });

  it("leaves primitives and already-camel keys untouched", () => {
    expect(convertKeysToCamelCase({ foo: 1, barBaz: 2 })).toEqual({
      foo: 1,
      barBaz: 2,
    });
    expect(convertKeysToCamelCase(42)).toBe(42);
    expect(convertKeysToCamelCase(null)).toBeNull();
  });
});

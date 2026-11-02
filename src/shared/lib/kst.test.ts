import { describe, it, expect } from "vitest";
import { formatKstDateTime, kstDateString, toKstIso } from "./kst";

describe("formatKstDateTime — 서버 시각(ISO+09:00)을 KST 표시 문자열로", () => {
  it("YYYY-MM-DD HH:mm", () => {
    expect(formatKstDateTime("2026-11-03T14:05:09+09:00")).toBe("2026-11-03 14:05");
  });

  it("초까지(withSeconds)", () => {
    expect(formatKstDateTime("2026-11-03T14:05:09+09:00", true)).toBe("2026-11-03 14:05:09");
  });

  it("다른 오프셋도 KST로 바꾼다", () => {
    expect(formatKstDateTime("2026-11-03T20:00:00Z")).toBe("2026-11-04 05:00");
  });

  it("해석할 수 없으면 원문 그대로", () => {
    expect(formatKstDateTime("not-a-date")).toBe("not-a-date");
  });
});

describe("kstDateString — KST 날짜(YYYY-MM-DD)", () => {
  it("UTC 15시 이후는 KST로 다음 날", () => {
    expect(kstDateString(new Date("2026-11-02T15:30:00Z"))).toBe("2026-11-03");
  });

  it("며칠 전 날짜(offsetDays)", () => {
    expect(kstDateString(new Date("2026-11-03T03:00:00Z"), -6)).toBe("2026-10-28");
  });
});

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

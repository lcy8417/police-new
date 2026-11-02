import { describe, expect, it } from "vitest";
import { PASSWORD_MESSAGES, passwordRuleError, utf8ByteLength } from "./password-rules";

describe("passwordRuleError — 설계서 §3 비밀번호 규칙", () => {
  it("8자 미만 거부", () => {
    expect(passwordRuleError("abc1234")).toBe(PASSWORD_MESSAGES.tooShort);
    expect(PASSWORD_MESSAGES.tooShort).toBe("비밀번호는 8자 이상이어야 합니다");
  });

  it("UTF-8 72바이트 초과 거부(자르지 않음)", () => {
    const korean25 = "가".repeat(25); // 3바이트 × 25 = 75바이트
    expect(utf8ByteLength(korean25)).toBe(75);
    expect(passwordRuleError(korean25)).toBe("비밀번호는 UTF-8 기준 72바이트 이하여야 합니다");
  });

  it("72바이트는 허용", () => {
    expect(passwordRuleError("a".repeat(72))).toBeNull();
    expect(passwordRuleError("가".repeat(24))).toBeNull();
  });

  it("8자는 허용", () => {
    expect(passwordRuleError("abcd1234")).toBeNull();
  });
});

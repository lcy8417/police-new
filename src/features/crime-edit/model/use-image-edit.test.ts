import { describe, expect, it } from "vitest";

import { prepareImage } from "./use-image-edit";

// 레거시 EditMain#prepareImage 규약 재현 검증(서버 전송 image 결정).
describe("prepareImage", () => {
  it("이미 편집된 data URL이면 그대로 보낸다", () => {
    const dataUrl = "data:image/png;base64,ABC123==";
    expect(prepareImage(dataUrl, "2024-001")).toBe(dataUrl);
  });

  it("data URL이 아니면(초기 미편집) crimeNumber를 보낸다", () => {
    expect(prepareImage("original.png", "2024-001")).toBe("2024-001");
    expect(prepareImage("", "2024-001")).toBe("2024-001");
  });
});

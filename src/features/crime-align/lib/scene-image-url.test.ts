import { describe, expect, it } from "vitest";
import { sceneImageUrl } from "./scene-image-url";

describe("sceneImageUrl (REQ-ALIGN-002b: 캔버스 소스 고정)", () => {
  it("VITE_API_URL + /crime_images/<crimeNumber>.png 형태를 반환한다", () => {
    const url = sceneImageUrl("2024-001");
    expect(url).toBe(`${import.meta.env.VITE_API_URL ?? ""}/crime_images/2024-001.png`);
  });

  it("editImage/edit 관련 문자열을 포함하지 않는다(정적 원본 고정)", () => {
    const url = sceneImageUrl("2024-002");
    expect(url).not.toContain("edit");
    expect(url).toContain("crime_images/2024-002.png");
  });

  it("서로 다른 crimeNumber는 서로 다른(오염 없는) URL을 만든다", () => {
    expect(sceneImageUrl("A")).not.toBe(sceneImageUrl("B"));
  });
});

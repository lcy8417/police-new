import { describe, expect, it } from "vitest";

import { prepareImage } from "./use-image-edit";

// 레거시 EditMain#prepareImage 규약 재현 검증(서버 전송 image 결정).
describe("prepareImage", () => {
  it("이미 편집된 data URL이면 그대로 보낸다", () => {
    const dataUrl = "data:image/png;base64,ABC123==";
    expect(prepareImage(dataUrl, "2024-001")).toBe(dataUrl);
  });

  it("data URL이 아니면(초기 미편집) 감정물 번호(aprthngNo) 원본 문자열을 보낸다", () => {
    expect(prepareImage("original.png", "05019-24-0017_5")).toBe("05019-24-0017_5");
    expect(prepareImage("", "05019-24-0017_5")).toBe("05019-24-0017_5");
    // 서버 이미지 URL이어도 파일명을 잘라 쓰지 않고 감정물 번호를 그대로 보낸다.
    expect(
      prepareImage("http://api/crime_images/05019-24-0017_5.png", "05019-24-0017_5")
    ).toBe("05019-24-0017_5");
  });
});

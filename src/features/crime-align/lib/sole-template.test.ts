import { describe, expect, it } from "vitest";

import { createSoleTemplatePolygon } from "./sole-template";
import { MIN_POLYGON_POINTS } from "./alignment-geometry";

describe("createSoleTemplatePolygon (REQ-ALIGN-017, AC-ALIGN-026)", () => {
  it("MIN_POLYGON_POINTS(3) 이상의 정점을 반환한다 — 저장 계약을 처음부터 만족", () => {
    const polygon = createSoleTemplatePolygon(400, 600);
    expect(polygon.length).toBeGreaterThanOrEqual(MIN_POLYGON_POINTS);
  });

  it("모든 정점이 (0..W, 0..H) 범위 안에 있다", () => {
    const W = 400;
    const H = 600;
    const polygon = createSoleTemplatePolygon(W, H);
    for (const [x, y] of polygon) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(W);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(H);
    }
  });

  it("이미지 중앙 근처에 배치된다(정점 평균이 중심에서 이미지 크기의 10% 이내)", () => {
    const W = 400;
    const H = 600;
    const polygon = createSoleTemplatePolygon(W, H);
    const avgX = polygon.reduce((sum, [x]) => sum + x, 0) / polygon.length;
    const avgY = polygon.reduce((sum, [, y]) => sum + y, 0) / polygon.length;
    // 밑창 윤곽선은 앞굽(뾰족)·뒤꿈치(둥근 바닥)가 비대칭이라 정점 평균이 기하 중심과
    // 완전히 일치하지는 않는다 — 이미지 크기 대비 10% 이내면 "중앙 근처"로 간주한다.
    expect(Math.abs(avgX - W / 2)).toBeLessThan(W * 0.1);
    expect(Math.abs(avgY - H / 2)).toBeLessThan(H * 0.1);
  });

  it("x축 대칭이다(밑창 형상은 좌우 대칭 실루엣)", () => {
    const polygon = createSoleTemplatePolygon(400, 600);
    const cx = 200;
    const sortedByY = [...polygon].sort((a, b) => a[1] - b[1]);
    // 정규화 윤곽선이 좌우 대칭이므로, 임의의 점 하나를 골라 대칭점이 존재하는지 확인.
    const [x, y] = sortedByY[0];
    const mirrored = polygon.find(
      ([mx, my]) => Math.abs(mx - (2 * cx - x)) < 1e-6 && Math.abs(my - y) < 1e-6
    );
    expect(mirrored).toBeDefined();
  });

  it("순수 함수 — 동일 입력에 동일 출력(결정적)", () => {
    const a = createSoleTemplatePolygon(500, 300);
    const b = createSoleTemplatePolygon(500, 300);
    expect(a).toEqual(b);
  });

  it("다른 이미지 크기에도 비례해 스케일된다", () => {
    const small = createSoleTemplatePolygon(200, 300);
    const large = createSoleTemplatePolygon(400, 600);
    // 큰 이미지의 폴리곤 폭이 작은 이미지의 폭보다 커야 한다(비례 스케일).
    const widthOf = (points: readonly (readonly [number, number])[]) => {
      const xs = points.map(([x]) => x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(widthOf(large)).toBeGreaterThan(widthOf(small));
  });
});

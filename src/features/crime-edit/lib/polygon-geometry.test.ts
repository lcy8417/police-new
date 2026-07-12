import { describe, it, expect } from "vitest";

import {
  MIN_POLYGON_POINTS,
  clampPolygon,
  computeRenderSize,
  isPolygonSubmittable,
  removeLastPoint,
  roundPolygon,
  serializePolygon,
  toCanvasPoint,
  type Point,
} from "./polygon-geometry";

describe("toCanvasPoint", () => {
  it("클라이언트 좌표에서 rect 오프셋을 빼 canvas-local 좌표로 변환한다", () => {
    expect(toCanvasPoint(150, 220, { left: 50, top: 20 })).toEqual([100, 200]);
  });

  it("소수 rect 오프셋/좌표를 정수로 반올림한다(백엔드 422 방지)", () => {
    // 100.6 - 0.4 = 100.2 → 100, 200.7 - 0.2 = 200.5 → 201(반올림)
    expect(toCanvasPoint(100.6, 200.7, { left: 0.4, top: 0.2 })).toEqual([
      100, 201,
    ]);
  });

  it("음수 결과도 반올림해 반환한다(clamp는 별도 단계)", () => {
    expect(toCanvasPoint(10, 5, { left: 20.4, top: 30.6 })).toEqual([-10, -26]);
  });
});

describe("roundPolygon", () => {
  it("모든 정점 좌표를 정수로 반올림한다", () => {
    const input: Point[] = [
      [10.4, 20.6],
      [30.5, 40.49],
    ];
    expect(roundPolygon(input)).toEqual([
      [10, 21],
      [31, 40],
    ]);
  });

  it("빈 배열이면 빈 배열", () => {
    expect(roundPolygon([])).toEqual([]);
  });
});

describe("clampPolygon", () => {
  const renderW = 300;
  const renderH = 200;

  it("음수 좌표를 0으로 clamp한다", () => {
    expect(clampPolygon([[-5, -10]], renderW, renderH)).toEqual([[0, 0]]);
  });

  it("범위를 초과한 좌표를 [renderW]/[renderH]로 clamp한다", () => {
    expect(clampPolygon([[500, 999]], renderW, renderH)).toEqual([
      [300, 200],
    ]);
  });

  it("범위 안 좌표는 그대로 둔다", () => {
    expect(clampPolygon([[120, 80]], renderW, renderH)).toEqual([[120, 80]]);
  });

  it("경계값(0, renderW, renderH)은 그대로 유지한다", () => {
    expect(
      clampPolygon(
        [
          [0, 0],
          [300, 200],
        ],
        renderW,
        renderH
      )
    ).toEqual([
      [0, 0],
      [300, 200],
    ]);
  });

  it("정수 입력이면 결과도 정수로 유지된다", () => {
    const result = clampPolygon([[350, 210]], renderW, renderH);
    expect(Number.isInteger(result[0][0])).toBe(true);
    expect(Number.isInteger(result[0][1])).toBe(true);
  });
});

describe("computeRenderSize", () => {
  it("rect width/height를 [width, height]로 반올림해 반환한다", () => {
    expect(computeRenderSize({ width: 300.4, height: 200.6 })).toEqual([
      300, 201,
    ]);
  });
});

describe("isPolygonSubmittable", () => {
  it("0/1/2점은 전송 불가(false)", () => {
    expect(isPolygonSubmittable([])).toBe(false);
    expect(isPolygonSubmittable([[0, 0]])).toBe(false);
    expect(
      isPolygonSubmittable([
        [0, 0],
        [1, 1],
      ])
    ).toBe(false);
  });

  it("정확히 3점(경계값)이면 전송 가능(true)", () => {
    expect(
      isPolygonSubmittable([
        [0, 0],
        [1, 1],
        [2, 2],
      ])
    ).toBe(true);
  });

  it("3점 초과도 전송 가능(true)", () => {
    expect(
      isPolygonSubmittable([
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
      ])
    ).toBe(true);
  });

  it("MIN_POLYGON_POINTS 상수는 3이다(레거시 계약)", () => {
    expect(MIN_POLYGON_POINTS).toBe(3);
  });
});

describe("serializePolygon", () => {
  it("레거시 body 형태 [[x,y], ...] 가변 배열로 직렬화한다", () => {
    const points: Point[] = [
      [10, 20],
      [30, 40],
      [50, 60],
    ];
    expect(serializePolygon(points)).toEqual([
      [10, 20],
      [30, 40],
      [50, 60],
    ]);
  });

  it("원본을 참조하지 않는 새 배열을 반환한다", () => {
    const points: Point[] = [[1, 2]];
    const result = serializePolygon(points);
    expect(result).not.toBe(points);
    expect(result[0]).not.toBe(points[0]);
  });
});

describe("removeLastPoint", () => {
  it("마지막 정점을 제거한다", () => {
    expect(
      removeLastPoint([
        [1, 1],
        [2, 2],
        [3, 3],
      ])
    ).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  it("빈 배열이면 빈 배열", () => {
    expect(removeLastPoint([])).toEqual([]);
  });

  it("원본을 변형하지 않는다", () => {
    const input: Point[] = [
      [1, 1],
      [2, 2],
    ];
    removeLastPoint(input);
    expect(input).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });
});

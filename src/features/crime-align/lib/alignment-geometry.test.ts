import { describe, expect, it } from "vitest";
import {
  ARROW_POINTS,
  MIN_POLYGON_POINTS,
  computeScale,
  isAlignmentComplete,
  isArrowComplete,
  isPolygonClosable,
  moveVertex,
  serializePoints,
  toDisplayFromSaved,
  toDisplayPoint,
  toDisplayPolygon,
  toSavedPoint,
  toSavedPolygon,
  translatePolygon,
  type Point,
  clampPointToBounds,
  clampPointsToBounds,
  clampTranslation,
} from "./alignment-geometry";

describe("computeScale (AC-ALIGN-016 참조 규칙: scale = img.width / dispW)", () => {
  it("계산은 naturalWidth / dispWidth", () => {
    expect(computeScale(1000, 500)).toBe(2);
    expect(computeScale(400, 400)).toBe(1);
  });

  it("scale > 2인 경계 케이스(REQ-ALIGN-013a 대상)", () => {
    expect(computeScale(1000, 400)).toBe(2.5);
  });
});

describe("toDisplayPoint", () => {
  it("clientX/clientY에서 rect.left/top을 뺀다(반올림 없음)", () => {
    const rect = { left: 10.4, top: 5.6, width: 100, height: 100 };
    const [x, y] = toDisplayPoint(50.7, 60.3, rect);
    expect(x).toBeCloseTo(40.3, 6);
    expect(y).toBeCloseTo(54.7, 6);
  });

  it("정수 절삭을 하지 않는다(REQ-ALIGN-013a)", () => {
    const rect = { left: 0, top: 0, width: 100, height: 100 };
    const [x, y] = toDisplayPoint(12.345, 67.891, rect);
    expect(x).toBeCloseTo(12.345, 6);
    expect(y).toBeCloseTo(67.891, 6);
  });
});

describe("toSavedPoint / toDisplayFromSaved 왕복 (AC-ALIGN-016/016a)", () => {
  it("참조 규칙 기대값과 일치 — 알려진 입력 집합", () => {
    // dispW=500, img.width=1000 → scale=2. 표시(250,150) → 저장(500,300).
    const scale = computeScale(1000, 500);
    expect(toSavedPoint([250, 150], scale)).toEqual([500, 300]);
    // 역방향: 저장(500,300) → 표시(250,150).
    expect(toDisplayFromSaved([500, 300], scale)).toEqual([250, 150]);
  });

  it("scale > 2 경계에서도 왕복 오차가 1px 이내(부동소수 보존)", () => {
    const scale = computeScale(1000, 400); // 2.5
    const original: Point = [123.456, 78.9];
    const display = toDisplayFromSaved(original, scale);
    const roundTripped = toSavedPoint(display, scale);
    expect(Math.abs(roundTripped[0] - original[0])).toBeLessThan(1);
    expect(Math.abs(roundTripped[1] - original[1])).toBeLessThan(1);
    // 절삭 없이 사실상 완전 일치(부동소수 오차 수준)해야 한다.
    expect(roundTripped[0]).toBeCloseTo(original[0], 9);
    expect(roundTripped[1]).toBeCloseTo(original[1], 9);
  });

  it("dispW === img.width(scale=1) 경계값", () => {
    const scale = computeScale(800, 800);
    expect(scale).toBe(1);
    expect(toSavedPoint([12.5, 34.75], scale)).toEqual([12.5, 34.75]);
  });

  it("축소 방향(dispW > img.width, scale < 1)도 왕복 보존", () => {
    const scale = computeScale(200, 400); // 0.5
    const original: Point = [300.25, 150.125];
    const roundTripped = toSavedPoint(toDisplayFromSaved(original, scale), scale);
    expect(roundTripped[0]).toBeCloseTo(original[0], 9);
    expect(roundTripped[1]).toBeCloseTo(original[1], 9);
  });
});

describe("toSavedPolygon / toDisplayPolygon", () => {
  it("정점 배열 전체를 일괄 환산한다", () => {
    const scale = 2;
    const display: Point[] = [
      [10, 10],
      [20, 10],
      [20, 20],
    ];
    const saved = toSavedPolygon(display, scale);
    expect(saved).toEqual([
      [20, 20],
      [40, 20],
      [40, 40],
    ]);
    expect(toDisplayPolygon(saved, scale)).toEqual(display);
  });
});

describe("isPolygonClosable / isArrowComplete / isAlignmentComplete", () => {
  it("폴리곤은 3점 미만이면 닫을 수 없다(엣지 케이스: 2점 이하 거부)", () => {
    expect(MIN_POLYGON_POINTS).toBe(3);
    expect(isPolygonClosable([])).toBe(false);
    expect(isPolygonClosable([[0, 0]])).toBe(false);
    expect(isPolygonClosable([[0, 0], [1, 1]])).toBe(false);
    expect(isPolygonClosable([[0, 0], [1, 1], [2, 2]])).toBe(true);
  });

  it("화살표는 정확히 2점이어야 한다", () => {
    expect(ARROW_POINTS).toBe(2);
    expect(isArrowComplete([])).toBe(false);
    expect(isArrowComplete([[0, 0]])).toBe(false);
    expect(isArrowComplete([[0, 0], [1, 1]])).toBe(true);
    expect(isArrowComplete([[0, 0], [1, 1], [2, 2]])).toBe(false);
  });

  it("정렬 설정됨 = 폴리곤 3점 이상 AND 화살표 정확히 2점(REQ-ALIGN-007c)", () => {
    expect(isAlignmentComplete([], [])).toBe(false);
    expect(isAlignmentComplete([[0, 0], [1, 1], [2, 2]], [])).toBe(false);
    expect(isAlignmentComplete([], [[0, 0], [1, 1]])).toBe(false);
    expect(
      isAlignmentComplete([[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 1]])
    ).toBe(true);
  });
});

describe("serializePoints", () => {
  it("[[x, y], ...] 가변 배열로 직렬화하며 float을 보존한다", () => {
    const points: Point[] = [[10.5, 20.25], [30.125, 40]];
    expect(serializePoints(points)).toEqual([
      [10.5, 20.25],
      [30.125, 40],
    ]);
  });
});

describe("translatePolygon (REQ-ALIGN-018 ① 전체 이동, AC-ALIGN-027(a))", () => {
  it("모든 정점을 (dx, dy)만큼 평행 이동하고 형태(상대 위치)를 유지한다", () => {
    const polygon: Point[] = [
      [10, 10],
      [20, 10],
      [20, 20],
    ];
    const moved = translatePolygon(polygon, 5, -3);
    expect(moved).toEqual([
      [15, 7],
      [25, 7],
      [25, 17],
    ]);
    // 형태 유지: 인접 정점 간 거리(엣지 벡터)가 원본과 동일해야 한다.
    const edge = (a: Point, b: Point) => [b[0] - a[0], b[1] - a[1]];
    expect(edge(moved[0], moved[1])).toEqual(edge(polygon[0], polygon[1]));
  });

  it("float 델타도 절삭 없이 보존한다(REQ-ALIGN-013a)", () => {
    const polygon: Point[] = [[1.5, 2.25]];
    expect(translatePolygon(polygon, 0.333, -0.111)).toEqual([[1.833, 2.139]]);
  });
});

describe("moveVertex (REQ-ALIGN-018 ② 정점별 조정, AC-ALIGN-027(b))", () => {
  it("지정한 인덱스의 정점만 교체하고 나머지는 불변이다", () => {
    const polygon: Point[] = [
      [0, 0],
      [10, 0],
      [10, 10],
    ];
    const moved = moveVertex(polygon, 1, [99, 99]);
    expect(moved).toEqual([
      [0, 0],
      [99, 99],
      [10, 10],
    ]);
    // 원본은 불변(순수 함수).
    expect(polygon[1]).toEqual([10, 0]);
  });
});

// ─── 좌표 범위 clamp (백엔드 save_alignment 범위 검사 대응) ───
describe("clampPointToBounds / clampPointsToBounds", () => {
  it("실제 보고된 실패 좌표 (-0.5, 210)을 범위 안으로 자른다", () => {
    // 백엔드 응답: "좌표 (-0.5, 210.0)가 저장 현장 이미지 범위(0..396, 0..906)를 벗어났습니다."
    expect(clampPointToBounds([-0.5, 210], 396, 906)).toEqual([0, 210]);
  });

  it("상한을 넘는 좌표는 이미지 크기로 자른다", () => {
    expect(clampPointToBounds([500, 1000], 396, 906)).toEqual([396, 906]);
  });

  it("범위 안의 좌표는 float 그대로 보존한다(REQ-ALIGN-013a — 반올림 금지)", () => {
    expect(clampPointToBounds([17.5, 56.25], 396, 906)).toEqual([17.5, 56.25]);
  });

  it("배열 전체를 clamp해 모든 점이 범위 안에 들어온다", () => {
    const out = clampPointsToBounds(
      [
        [-0.5, 210],
        [17.5, 56],
        [400, 950],
      ],
      396,
      906
    );
    for (const [x, y] of out) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(396);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(906);
    }
  });
});

describe("clampTranslation — 전체 이동은 형태를 보존한다", () => {
  const square: Point[] = [
    [10, 10],
    [110, 10],
    [110, 110],
    [10, 110],
  ];

  it("범위 안에서는 요청한 이동량을 그대로 허용한다", () => {
    expect(clampTranslation(square, 20, 30, 400, 900)).toEqual([20, 30]);
  });

  it("왼쪽 경계를 넘어가면 딱 경계까지만 이동한다(정점이 눌리지 않음)", () => {
    // minX=10 이므로 dx는 -10까지만 허용된다.
    const [dx] = clampTranslation(square, -50, 0, 400, 900);
    expect(dx).toBe(-10);
  });

  it("오른쪽 경계를 넘어가면 딱 경계까지만 이동한다", () => {
    // maxX=110, width=400 → dx는 290까지.
    const [dx] = clampTranslation(square, 999, 0, 400, 900);
    expect(dx).toBe(290);
  });

  it("폴리곤이 이미지보다 큰 축에서는 이동하지 않는다(찌그러짐 방지)", () => {
    const tooWide: Point[] = [
      [-50, 10],
      [500, 10],
      [500, 110],
    ];
    expect(clampTranslation(tooWide, 30, 20, 400, 900)[0]).toBe(0);
  });
});

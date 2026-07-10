import { describe, it, expect } from "vitest";

import {
  LINE_HIT_THRESHOLD,
  isNearAnyLine,
  moveLine,
  pickDraggableLine,
} from "./line-geometry";

describe("pickDraggableLine", () => {
  const lines = [100, 200];

  it("선 정중앙을 잡으면 그 선을 고른다", () => {
    expect(pickDraggableLine(lines, 100)).toBe(0);
    expect(pickDraggableLine(lines, 200)).toBe(1);
  });

  it("threshold 바로 안쪽(거리 4.99)은 인식한다", () => {
    expect(pickDraggableLine(lines, 100 + (LINE_HIT_THRESHOLD - 0.01))).toBe(0);
  });

  it("threshold 경계값(거리 정확히 5)은 인식하지 않는다 — 레거시 strict `< 5` 보존", () => {
    expect(pickDraggableLine(lines, 100 + LINE_HIT_THRESHOLD)).toBeNull();
    expect(pickDraggableLine(lines, 100 - LINE_HIT_THRESHOLD)).toBeNull();
  });

  it("어떤 선과도 멀면 null", () => {
    expect(pickDraggableLine(lines, 150)).toBeNull();
  });

  it("두 선이 모두 근처면 마지막 인덱스가 승리한다(forEach 마지막 우선)", () => {
    const overlapping = [100, 102];
    expect(pickDraggableLine(overlapping, 101)).toBe(1);
  });

  it("빈 배열이면 null", () => {
    expect(pickDraggableLine([], 100)).toBeNull();
  });
});

describe("isNearAnyLine", () => {
  const lines = [100, 200];

  it("한 선이라도 근처면 true", () => {
    expect(isNearAnyLine(lines, 103)).toBe(true);
  });

  it("모든 선과 멀면 false", () => {
    expect(isNearAnyLine(lines, 150)).toBe(false);
  });

  it("경계값(거리 정확히 5)은 false", () => {
    expect(isNearAnyLine(lines, 105)).toBe(false);
  });
});

describe("moveLine", () => {
  it("드래그 중인 선을 y + offsetY로 이동한다", () => {
    expect(moveLine([100, 200], 0, 130, 5)).toEqual([135, 200]);
    expect(moveLine([100, 200], 1, 210, -3)).toEqual([100, 207]);
  });

  it("잡은 오프셋을 유지한다(잡은 지점 기준 상대 이동)", () => {
    // 선이 100, 커서 105에서 잡으면 offsetY = 100 - 105 = -5.
    // 커서를 140으로 옮기면 새 선 위치 = 140 + (-5) = 135.
    expect(moveLine([100, 200], 0, 140, -5)).toEqual([135, 200]);
  });

  it("draggingLine이 null이면 원본을 그대로(복사본으로) 반환한다", () => {
    const input = [100, 200];
    const result = moveLine(input, null, 999, 999);
    expect(result).toEqual([100, 200]);
    expect(result).not.toBe(input);
  });

  it("범위를 벗어난 인덱스는 무시한다", () => {
    expect(moveLine([100, 200], 5, 300, 0)).toEqual([100, 200]);
    expect(moveLine([100, 200], -1, 300, 0)).toEqual([100, 200]);
  });

  it("원본 배열을 변형하지 않는다", () => {
    const input = [100, 200];
    moveLine(input, 0, 500, 0);
    expect(input).toEqual([100, 200]);
  });
});

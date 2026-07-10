/**
 * 패턴추출 캔버스의 "선(line) 편집" 순수 기하 함수 모음.
 *
 * 레거시 `src/components/Canvas.jsx`의 선편집 useEffect(마우스로 상/중/하 경계를
 * 나누는 두 수평선을 잡아 드래그하던 로직)에서 순수 계산 부분만 떼어냈다. DOM/canvas
 * 접근 없이 좌표 배열만 다루므로 vitest로 경계값을 검증할 수 있다. 여기 담긴 규약은
 * 레거시 동작을 그대로 보존한다(추출 시 서버로 보내는 `line_ys` 값이 달라지지 않도록).
 */

/** 커서 y가 선으로 "인식"되는 최대 거리(px). 레거시 Canvas의 `Math.abs(...) < 5` 판정과 동일. */
export const LINE_HIT_THRESHOLD = 5;

/**
 * 커서 y 근처(threshold 미만)에 있는 선들 중 "마지막" 인덱스를 반환한다.
 * 레거시 handleMouseDown이 `lineYs.forEach`로 순회하며 마지막으로 일치한 선을
 * `draggingLine`으로 덮어쓰던 동작을 그대로 보존한다(여러 선이 겹칠 때 마지막이 승리).
 * 근처에 아무 선도 없으면 null.
 */
export function pickDraggableLine(
  lineYs: readonly number[],
  y: number,
  threshold: number = LINE_HIT_THRESHOLD
): number | null {
  let picked: number | null = null;
  lineYs.forEach((lineY, idx) => {
    if (Math.abs(y - lineY) < threshold) picked = idx;
  });
  return picked;
}

/** 커서 y가 어떤 선 근처인지 여부(커서 스타일 판정용). 레거시 `.some(...)`와 동일. */
export function isNearAnyLine(
  lineYs: readonly number[],
  y: number,
  threshold: number = LINE_HIT_THRESHOLD
): boolean {
  return lineYs.some((lineY) => Math.abs(y - lineY) < threshold);
}

/**
 * 드래그 중인 선의 새로운 y 배열을 계산한다. 잡은 지점의 오프셋(offsetY)을 유지한 채
 * 커서를 따라가도록(newY = y + offsetY) 하여, 레거시 handleMouseMove의
 * `newLines[draggingLine] = y + prev.offsetY` 규약을 보존한다. `draggingLine`이
 * null(또는 범위를 벗어난 인덱스)이면 원본을 얕게 복사해 그대로 반환한다.
 */
export function moveLine(
  lineYs: readonly number[],
  draggingLine: number | null,
  y: number,
  offsetY: number
): number[] {
  const next = [...lineYs];
  if (
    draggingLine === null ||
    draggingLine < 0 ||
    draggingLine >= next.length
  ) {
    return next;
  }
  next[draggingLine] = y + offsetY;
  return next;
}

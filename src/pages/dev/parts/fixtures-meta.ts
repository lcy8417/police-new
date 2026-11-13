// 진열 예시의 「데이터」 부분(그리는 코드 없음). Node/Playwright 스펙(tests/ui/parts-compare.spec.ts)이 이 파일만 읽는다.
// 그리는 쪽은 fixtures.tsx(id 로 짝). 두 파일의 id 집합이 같은지는 fixtures.test.ts 가 지킨다.
// 시안과 같은 고정 예시(문구 · 부모 폭)로 그린다(설계서 §9).

/** 진열 상자 바탕. 시안 요소의 가장 가까운 불투명 조상 배경에 해당하는 토큰. */
export type FixtureSurface = "canvas" | "panel" | "panel-2" | "panel-3" | "strip";

/** 진열할 부품 예시 하나(데이터). */
export interface PartFixture {
  /** 시안 `data-part-id` 와 같은 값(형식 `S01-03`). 부품 루트에도 같은 값이 붙어야 한다. */
  id: string;
  /** 부품 이름(PascalCase, 시안 `data-part`) */
  part: string;
  /** 변형 이름(시안 `data-part-variant`) */
  variant?: string;
  /** 상태 이름(시안 `data-part-state`) */
  state?: string;
  /** 부품을 담는 상자 폭(px) — 시안에서 그 부품의 부모 폭 */
  parentWidth: number;
  /** 상자 바탕(기본 canvas) — 투명 · 둥근 모서리 뒤로 비치는 색을 시안과 맞춘다 */
  surface?: FixtureSurface;
}

// 부품이 구현되면 한 줄씩 늘린다. 변형마다 대표 1개(같은 변형의 다른 자리 id 는 값이 같아 생략).
export const PART_FIXTURES: PartFixture[] = [
  // Button
  { id: "S01-01", part: "Button", variant: "sm", parentWidth: 605, surface: "panel" },
  { id: "S01-02", part: "Button", variant: "sm-pri", parentWidth: 605, surface: "panel" },
  { id: "S01-03", part: "Button", variant: "sm-h26", parentWidth: 289, surface: "panel" },
  { id: "S01-04", part: "Button", variant: "sm-ok-row", parentWidth: 73, surface: "panel" },
  { id: "S01-06", part: "Button", variant: "sm-warn-row", parentWidth: 115, surface: "panel-3" },
  { id: "S02-02", part: "Button", variant: "sm-h22", parentWidth: 265, surface: "panel" },
  { id: "S02-03", part: "Button", variant: "sm", state: "role-lock", parentWidth: 282, surface: "panel" },
  // Chip
  { id: "S01-07", part: "Chip", variant: "violet-h20", parentWidth: 47, surface: "panel" },
  { id: "S01-08", part: "Chip", variant: "green-h18", parentWidth: 256, surface: "panel-2" },
  { id: "S01-09", part: "Chip", variant: "h18", parentWidth: 256, surface: "panel-2" },
  { id: "S01-20", part: "Chip", variant: "blue", parentWidth: 185, surface: "strip" },
  { id: "S02-04", part: "Chip", variant: "amber-h18", parentWidth: 208, surface: "panel" },
  { id: "S02-05", part: "Chip", variant: "amber", parentWidth: 300, surface: "panel" },
  { id: "S02-06", part: "Chip", variant: "amber-h19", parentWidth: 274, surface: "panel" },
  { id: "S02-07", part: "Chip", variant: "h19", parentWidth: 274, surface: "panel" },
  { id: "S02-08", part: "Chip", variant: "blue-h20", parentWidth: 842, surface: "panel" },
  { id: "S02-09", part: "Chip", variant: "h20-warn", parentWidth: 842, surface: "panel" },
  { id: "S02-10", part: "Chip", variant: "blue-mono-h20", parentWidth: 842, surface: "panel" },
];

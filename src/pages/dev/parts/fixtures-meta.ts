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
  /** 상자에 붙는 클래스 — 시안에서 부품이 부모로부터 상속받는 값(줄 높이 등)을 재현한다(부품이 아니라 부모 맥락) */
  boxClass?: string;
  /**
   * 대조 범위. 기본은 요소 + 자식 트리 전부. `"root"` 는 부품 루트의 계산값만 비교한다 —
   * 시안 `.inp` 는 글자를 span 안에 직접 쓴 모양이라 진짜 `<input>` 부품과는 태그 · 자식 트리가
   * 구조상 같을 수 없기 때문(Field 만 해당, 보고서 참고).
   */
  compare?: "root";
  /** 픽셀 비교를 건너뛰는 이유(있으면 계산값 비교만 한다). 구조상 같은 픽셀이 될 수 없는 경우에만 쓴다. */
  noShot?: string;
}

// 부품이 구현되면 한 줄씩 늘린다. 변형마다 대표 1개(같은 변형의 다른 자리 id 는 값이 같아 생략).
export const PART_FIXTURES: PartFixture[] = [
  // Button
  { id: "S01-01", part: "Button", variant: "sm", parentWidth: 605, surface: "panel" },
  { id: "S01-02", part: "Button", variant: "sm-pri", parentWidth: 605, surface: "panel" },
  { id: "S01-03", part: "Button", variant: "sm-h26", parentWidth: 289, surface: "panel" },
  { id: "S01-04", part: "Button", variant: "sm-ok-row", parentWidth: 73, surface: "panel", boxClass: "leading-[normal]" },
  { id: "S01-06", part: "Button", variant: "sm-warn-row", parentWidth: 115, surface: "panel-3", boxClass: "leading-[normal]" },
  { id: "S02-02", part: "Button", variant: "sm-h22", parentWidth: 265, surface: "panel" },
  { id: "S02-03", part: "Button", variant: "sm", state: "role-lock", parentWidth: 282, surface: "panel" },
  // Chip
  { id: "S01-07", part: "Chip", variant: "violet-h20", parentWidth: 47, surface: "panel", boxClass: "leading-[normal]" },
  { id: "S01-08", part: "Chip", variant: "green-h18", parentWidth: 256, surface: "panel-2", boxClass: "leading-[normal]" },
  { id: "S01-09", part: "Chip", variant: "h18", parentWidth: 256, surface: "panel-2", boxClass: "leading-[normal]" },
  { id: "S01-20", part: "Chip", variant: "blue", parentWidth: 185, surface: "strip" },
  { id: "S02-04", part: "Chip", variant: "amber-h18", parentWidth: 208, surface: "panel", boxClass: "leading-[normal]" },
  { id: "S02-05", part: "Chip", variant: "amber", parentWidth: 300, surface: "panel" },
  { id: "S02-06", part: "Chip", variant: "amber-h19", parentWidth: 274, surface: "panel", boxClass: "leading-[1.4]" },
  { id: "S02-07", part: "Chip", variant: "h19", parentWidth: 274, surface: "panel", boxClass: "leading-[1.4]" },
  { id: "S02-08", part: "Chip", variant: "blue-h20", parentWidth: 842, surface: "panel" },
  { id: "S02-09", part: "Chip", variant: "h20-warn", parentWidth: 842, surface: "panel" },
  { id: "S02-10", part: "Chip", variant: "blue-mono-h20", parentWidth: 842, surface: "panel" },
  // Field (시안 .inp 는 span 이라 루트 계산값만 대조)
  { id: "S01-10", part: "Field", variant: "select", parentWidth: 288.65625, surface: "panel", compare: "root" },
  { id: "S01-11", part: "Field", parentWidth: 288.671875, surface: "panel", compare: "root" },
  { id: "S01-12", part: "Field", variant: "mono", parentWidth: 288.65625, surface: "panel", compare: "root" },
  { id: "S01-13", part: "Field", variant: "mono-sm", parentWidth: 288.65625, surface: "panel", compare: "root" },
  { id: "S01-19", part: "Field", variant: "search-shell", parentWidth: 260, surface: "strip", compare: "root", noShot: "돋보기가 시안은 글자 ⌕, 부품은 lucide Search 아이콘(브리프 지정)" },
  { id: "S02-14", part: "Field", variant: "pick", parentWidth: 225.78125, surface: "panel", compare: "root" },
  { id: "S02-15", part: "Field", variant: "mono-sm-flex", parentWidth: 243, surface: "panel", boxClass: "flex items-center", compare: "root", noShot: "<input> 안쪽 글자의 세로 위치가 소수 y(.47)에서 span 글자와 1px 어긋남(브라우저 입력칸 고유)" },
  { id: "S02-16", part: "Field", variant: "select-mono", parentWidth: 293, surface: "panel", compare: "root" },
  { id: "S02-20", part: "Field", variant: "select-warn", parentWidth: 281, surface: "panel", compare: "root", noShot: "<input> 안쪽 글자의 세로 위치 어긋남(위와 같은 이유) + 칩 앞 공백 폭 차이" },
];

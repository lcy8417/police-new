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
   * 대조 범위. 기본은 요소 + 자식 트리 전부. `"control"` 은 폼 입력칸용(R18): 시안 `.inp` 는 글자를 span 안에 직접 쓴
   * 모양이라 루트 태그와 앱 `<input>`(· 돋보기 svg) 자식만 구조상 다르다 — 이 둘만 무시하고 나머지(루트 · ::before/::after ·
   * 캐럿 · 칩 등 자식)는 그대로 비교한다. Field 만 해당.
   */
  compare?: "control";
  /** 픽셀 비교를 건너뛰는 이유(있으면 계산값 비교만 한다). 측정으로 확인된 구체 이유가 있을 때만 쓴다. */
  noShot?: string;
  /** 픽셀 비교 허용 픽셀 수(기본 0). 쓰면 숫자와 이유를 주석으로 남긴다. */
  shotMaxDiffPixels?: number;
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
  { id: "S01-10", part: "Field", variant: "select", parentWidth: 288.65625, surface: "panel", compare: "control" },
  { id: "S01-11", part: "Field", parentWidth: 288.671875, surface: "panel", compare: "control" },
  { id: "S01-12", part: "Field", variant: "mono", parentWidth: 288.65625, surface: "panel", compare: "control" },
  { id: "S01-13", part: "Field", variant: "mono-sm", parentWidth: 288.65625, surface: "panel", compare: "control" },
  { id: "S01-19", part: "Field", variant: "search-shell", parentWidth: 260, surface: "strip", compare: "control", noShot: "돋보기가 시안은 글자 ⌕, 부품은 lucide Search 아이콘(브리프 지정)" },
  { id: "S02-14", part: "Field", variant: "pick", parentWidth: 225.78125, surface: "panel", compare: "control" },
  { id: "S02-15", part: "Field", variant: "mono-sm-flex", parentWidth: 243, surface: "panel", boxClass: "flex items-center", compare: "control", noShot: "측정: 156픽셀 차이, 차이 이미지는 글자 줄뿐(상자·테두리 0). 시안 요소가 소수 y=.47 에 놓일 때 <input> 안쪽 글자의 세로 위치가 span 글자와 달리 반올림됨(같은 글꼴의 S01-13 은 y=.70 이라 통과)" },
  { id: "S02-16", part: "Field", variant: "select-mono", parentWidth: 293, surface: "panel", compare: "control" },
  { id: "S02-20", part: "Field", variant: "select-warn", parentWidth: 281, surface: "panel", compare: "control", shotMaxDiffPixels: 1 /* 측정: 글자 가장자리 1픽셀(칩 앞 공백 위치의 소수 반올림), 나머지 0 */ },
];

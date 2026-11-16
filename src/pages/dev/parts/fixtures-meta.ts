import { AI_PART_FIXTURES } from "./fixtures-ai-meta";
import { KIT_PART_FIXTURES } from "./fixtures-kit-meta";
import { VIEWER_FIXTURES } from "./fixtures-viewer-meta";

// 진열 예시의 「데이터」 부분(그리는 코드 없음). Node/Playwright 스펙(tests/ui/parts-compare.spec.ts)이 이 파일만 읽는다.
// 그리는 쪽은 fixtures.tsx(id 로 짝). 두 파일의 id 집합이 같은지는 fixtures.test.ts 가 지킨다.
// 시안과 같은 고정 예시(문구 · 부모 폭)로 그린다(설계서 §9).

/** 진열 상자 바탕. 시안 요소의 가장 가까운 불투명 조상 배경에 해당하는 토큰. */
export type FixtureSurface = "canvas" | "panel" | "panel-2" | "panel-3" | "strip" | "ai";

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
  compare?: "control" | "shell" | "shell-head";
  /**
   * `compare` 가 `"shell"`(루트 + 가상요소만) · `"shell-head"`(+ 머리 한 줄)일 때 쓴다: 컨테이너(Panel · ButtonBar)는 안쪽 내용이
   * 부품이 아니라 대조에서 뺀다. 이 값은 내용 크기로 정해져 재현할 수 없는 루트 width/height 를 뺄 때만 쓴다(이유를 주석으로).
   */
  ignoreSize?: ("width" | "height")[];
  /**
   * 시안이 부품 루트에 인라인으로 준 위치(position · top/right/bottom/left)는 화면 소유의 배치(R22 · R25)라 대조에서 뺀다.
   * 루트 요소의 이 다섯 값만 제외하며 가상요소 · 자식 · 나머지 값(filter · 크기 · 색)은 그대로 비교한다. 측정값을 주석으로 남길 것.
   */
  ignorePlacement?: true;
  /** true 면 대조에서 태그 이름만 통일한다(접근성 때문에 시안 span 대신 button · div(role)로 그린 부품). 계산값 · 자식 수는 그대로 비교. */
  ignoreTags?: true;
  /** 시안에 같은 모양(표식)이 없어 시안 짝 대조(parts-compare)를 하지 않고 진열만 하는 이유. 있으면 대조 테스트에서 빠진다. */
  noMockup?: string;
  /** 픽셀 비교를 건너뛰는 이유(있으면 계산값 비교만 한다). 측정으로 확인된 구체 이유가 있을 때만 쓴다. */
  noShot?: string;
  /** 픽셀 비교 허용 픽셀 수(기본 0). 쓰면 숫자와 이유를 주석으로 남긴다. */
  shotMaxDiffPixels?: number;
}

// 부품이 구현되면 한 줄씩 늘린다. 변형마다 대표 1개(같은 변형의 다른 자리 id 는 값이 같아 생략).
const BASE_PART_FIXTURES: PartFixture[] = [
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
  // Panel — 높이는 배치라 상자(grid + 고정 높이)가 정한다: grid 자식은 세로로 늘어나 Panel 높이가 시안(150 · 760)과 같아진다.
  // S02-17 · S02-18 은 시안에서 opacity .3 틀 + 덮개(rgba(5,8,13,.7)) 아래라 요소 촬영에 덮개가 비친다 → 계산값만(안쪽 12줄까지 전체 트리 비교).
  { id: "S02-17", part: "Panel", variant: "default", parentWidth: 1180, boxClass: "grid h-[150px]", noShot: "시안 요소가 opacity .3 틀 · 반투명 덮개 아래라 촬영에 비친다(측정: 시안 자리 y=-17, 덮개 겹침)" },
  { id: "S02-18", part: "Panel", variant: "default-pad", parentWidth: 1180, boxClass: "grid h-[760px]", noShot: "S02-17 과 같다(opacity .3 틀 · 덮개 아래)" },
  // S01-15 는 표(14행 · 그림 · 소수 높이 551.31)가 안쪽이라 재현 대상이 아니다: 루트 · ::before/::after(모서리 장식) · 머리 한 줄만 비교.
  { id: "S01-15", part: "Panel", variant: "tc", parentWidth: 1180, compare: "shell-head", ignoreSize: ["height"], noShot: "안쪽 표(14행 · 그림)를 재현하지 않아 그림이 다르다. 높이 551.31 은 그 표 내용 크기" },
  // ButtonBar — 안쪽(라디오 · 분할 버튼 · 구분선 · 숨은 칩)은 Button 외 시안 조각이라 루트 자기 값만 비교한다.
  { id: "S01-16", part: "ButtonBar", variant: "panel-head", parentWidth: 1178, surface: "panel", boxClass: "flex", compare: "shell", ignoreSize: ["width", "height"], noShot: "안쪽 라디오 · 분할(seg) 조각을 재현하지 않아 폭 605 · 높이 38(seg 높이)이 다르다. 바탕도 패널 머리의 반투명 색" },
  { id: "S02-23", part: "ButtonBar", variant: "modal-head", parentWidth: 1178, surface: "panel", boxClass: "flex", compare: "shell", noShot: "시안 바탕이 모달 머리의 가로 그라데이션(폭 1178 전체에 걸침)이라 진열 상자 단색 바탕으로 재현 불가" },
  // AiTag
  // S01-17 · S01-18 은 표 셀 아래로 5px 튀어나온 표식(bottom:-5px)이라 시안 촬영이 자기 것이 아닌 픽셀을 담는다. 측정(S01-18): 둥근 모서리 뒤로 셀 안
  // 그림(imgbox)이 비치고(예 모서리 21,23,26 ↔ 진열 5,8,13), 아래쪽 안쪽 픽셀이 표식 배경 11,42,38 이 아니라 10,38,34(다음 행이 덮음). 계산값 · 자식(점)은 전체 대조.
  // 배치(R25): 시안 인라인 위치 — S01-17 position absolute, top 30px, right -6.05px, bottom -5px, left 4px / S01-18 absolute, top 30px, right 1.61px, bottom -5px, left 12px (구현은 static / auto).
  { id: "S01-17", part: "AiTag", variant: "progress", parentWidth: 40, surface: "panel", ignorePlacement: true, noShot: "표 셀 밖으로 튀어나온 표식: 모서리 뒤로 그림이 비치고 아래쪽을 다음 행이 덮음(측정은 위 주석)" },
  { id: "S01-18", part: "AiTag", variant: "done", parentWidth: 40, surface: "panel", ignorePlacement: true, noShot: "S01-17 과 같다(측정: 모서리 21,23,26 ↔ 5,8,13 · 안쪽 아래 10,38,34 ↔ 11,42,38)" },
  { id: "S02-21", part: "AiTag", variant: "default", parentWidth: 265, surface: "ai", boxClass: "flex items-center" },
  // Stepper(r2) — S01 사건 목록 「진행」 칸
  { id: "S01-44", part: "Stepper", parentWidth: 101.94, surface: "panel", boxClass: "grid text-[12px] leading-[normal] text-fg-2" },
];

// 갈래별 진열 데이터를 이어 붙인다(잠금, Task 5).
export const PART_FIXTURES: PartFixture[] = [
  ...BASE_PART_FIXTURES,
  ...KIT_PART_FIXTURES,
  ...VIEWER_FIXTURES,
  ...AI_PART_FIXTURES,
];

// kit 갈래 진열 예시의 「데이터」. fixtures-meta.ts 의 PART_FIXTURES 에 이어 붙는다.
// 시안에 표식을 단 자리는 짝 대조(parts-compare)가 돌고, 시안에 없는 모양은 `noMockup` 이유를 적어 진열만 한다.
import type { PartFixture } from "./fixtures-meta";

const NO_MOCKUP_FORM = "시안에 없는 모양(새로 만든 부품) — 진열만 하고 시안 짝 대조는 하지 않는다";

export const KIT_PART_FIXTURES: PartFixture[] = [
  // S01 목록 머리 「기본 보기 15열 / SCAS 열 전체 보기」 — 시안 .seg (기본 변형)
  { id: "S01-71", part: "Segmented", parentWidth: 400, surface: "panel", ignoreTags: true },
  { id: "S01-72", part: "Segmented", variant: "scas", parentWidth: 260, surface: "panel", noMockup: "시안 S01~S15에 `.is-scas` 눌림을 쓰는 자리가 없음" },
  // S01 목록 머리 「목록보기 / 문양보기」 — 시안 .radio (글자 12px는 부모에서 상속)
  { id: "S01-76", part: "RadioRow", parentWidth: 260, surface: "panel", boxClass: "text-[12px]", noMockup: "대조 실패(남은 차이): 부품은 칸마다 button 이고 ◉○ 를 aria-hidden 글자 span 으로 그리는데 시안은 span 의 ::before 로 그림 — 자식 수 · 가상요소 구조가 다름(접근성 때문에 일부러)" },
  { id: "S02-72", part: "Combobox", parentWidth: 260, surface: "panel", noMockup: "시안에 관서 검색 칸의 열린 모양이 없음(S02는 닫힌 칸뿐)" },
  { id: "S11-71", part: "StatusDot", variant: "ok", parentWidth: 160, surface: "panel", noMockup: "시안 `.dot` 은 칩 안 점이라 글자가 따로 붙는 부품 모양과 다름" },
  { id: "S11-72", part: "StatusDot", variant: "danger", parentWidth: 160, surface: "panel", noMockup: "S11-71 과 같다" },
  // 상단 메뉴 사용자 이니셜(analyst)
  { id: "S01-73", part: "Avatar", parentWidth: 60, surface: "panel" },
  { id: "S01-74", part: "DataGrid", parentWidth: 520, surface: "panel", noMockup: "시안 표는 화면마다 열 · 그림이 달라 한 짝으로 못 맞춤(열 정의는 화면이 정함)" },
  { id: "S01-75", part: "Pagination", parentWidth: 520, surface: "panel", noMockup: "시안 S01은 「페이지 1 / 9」 입력형, 부품은 이전 · 다음 + 범위 글자" },
  { id: "S00-71", part: "InlineError", parentWidth: 260, surface: "panel", noMockup: NO_MOCKUP_FORM },
  // r3 편의 부품 — 시안 짝 없음(사용자 r3 피드백으로 새로 만든 부품). 진열만 한다.
  { id: "S01-81", part: "FilterBar", parentWidth: 640, surface: "panel", noMockup: NO_MOCKUP_FORM },
  { id: "S01-82", part: "ColumnPicker", parentWidth: 260, surface: "panel", boxClass: "h-[40px]", noMockup: NO_MOCKUP_FORM },
  { id: "S01-83", part: "ViewCountSwitch", parentWidth: 260, surface: "panel", noMockup: NO_MOCKUP_FORM },
  { id: "S01-84", part: "AutoPlayControl", variant: "auto", parentWidth: 640, surface: "panel", noMockup: NO_MOCKUP_FORM },
  { id: "S01-85", part: "AutoPlayControl", variant: "manual", parentWidth: 300, surface: "panel", noMockup: NO_MOCKUP_FORM },
];

// kit 갈래(Task 2) 진열 예시의 「데이터」. 컨트롤러가 fixtures-meta.ts 의 PART_FIXTURES 에 합친다.
// id 는 시안에 표식을 달 때 쓸 값(S01-71 …)이며 다른 갈래와 겹치지 않도록 7x 번대를 썼다.
// 시안에 아직 표식이 없어 짝 대조(parts-compare)는 표식을 단 뒤에 켠다 — 노트 kit.md 참고.
import type { PartFixture } from "./fixtures-meta";

export const KIT_PART_FIXTURES: PartFixture[] = [
  { id: "S01-71", part: "Segmented", parentWidth: 260, surface: "panel" },
  { id: "S01-72", part: "Segmented", variant: "scas", parentWidth: 260, surface: "panel" },
  { id: "S02-71", part: "RadioRow", parentWidth: 260, surface: "panel" },
  { id: "S02-72", part: "Combobox", parentWidth: 260, surface: "panel" },
  { id: "S11-71", part: "StatusDot", variant: "ok", parentWidth: 160, surface: "panel" },
  { id: "S11-72", part: "StatusDot", variant: "danger", parentWidth: 160, surface: "panel" },
  { id: "S01-73", part: "Avatar", parentWidth: 60, surface: "panel" },
  { id: "S01-74", part: "DataGrid", parentWidth: 520, surface: "panel" },
  { id: "S01-75", part: "Pagination", parentWidth: 520, surface: "panel" },
  { id: "S00-71", part: "InlineError", parentWidth: 260, surface: "panel" },
];

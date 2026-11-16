// viewer 출입구 진열 예시의 「데이터」 부분(그리는 쪽은 fixtures-viewer.tsx, id 로 짝).
// 컨트롤러가 fixtures-meta.ts 의 PART_FIXTURES 에 이어 붙인다(Task 5). 시안에 아직 이 id 표식이 없다 —
// 노트(docs/superpowers/sprint/2026-11-16-scas-screens-mock/viewer.md)의 「시안 표식 요청」 참고.
import type { PartFixture } from "./fixtures-meta";

export const VIEWER_FIXTURES: PartFixture[] = [
  { id: "S05-31", part: "EvidenceImage", variant: "raw", parentWidth: 200, surface: "panel" },
  { id: "S05-32", part: "EvidenceImage", variant: "binary", parentWidth: 200, surface: "panel" },
  { id: "S01-31", part: "SoleThumb", variant: "md", parentWidth: 200, surface: "panel" },
  { id: "S04-31", part: "PatternIcon", variant: "md", parentWidth: 200, surface: "panel" },
  { id: "S04-32", part: "PatternIcon", variant: "sm", state: "sel", parentWidth: 200, surface: "panel" },
  { id: "S04-33", part: "ZoneBands", parentWidth: 200, surface: "panel", boxClass: "relative h-[300px]" },
  { id: "S06-31", part: "CompareView", variant: "side", parentWidth: 420, surface: "panel" },
  { id: "S06-32", part: "CompareView", variant: "slide", parentWidth: 420, surface: "panel" },
  { id: "S06-33", part: "PointPairs", variant: "crime", parentWidth: 200, surface: "panel", boxClass: "relative h-[300px]" },
];

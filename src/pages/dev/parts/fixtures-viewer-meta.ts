// viewer 출입구 진열 예시의 「데이터」 부분(그리는 쪽은 fixtures-viewer.tsx, id 로 짝). fixtures-meta.ts 의 PART_FIXTURES 에 이어 붙는다.
// 시안 짝이 있는 것은 SoleThumb · PatternIcon 둘이고, 나머지는 시안이 그림(SVG)이거나 화면마다 달라 진열만 한다(noMockup).
import type { PartFixture } from "./fixtures-meta";

const FAKE_ART = "시안은 인라인 SVG 그림, 앱은 가짜 그림(개발 전용 데이터 URL)이라 안쪽이 같을 수 없음";

export const VIEWER_FIXTURES: PartFixture[] = [
  { id: "S05-31", part: "EvidenceImage", variant: "raw", parentWidth: 200, surface: "panel", noMockup: FAKE_ART + " — 틀 모양은 단위 테스트가 지킴" },
  { id: "S05-32", part: "EvidenceImage", variant: "binary", parentWidth: 200, surface: "panel", noMockup: FAKE_ART + "(이진화는 근사)" },
  // 시안 S01 신발 칸의 작은 그림(30×44). 안쪽 그림이 다르므로 루트(+가상요소)만 계산값 대조, 픽셀은 뺀다.
  { id: "S01-31", part: "SoleThumb", variant: "md", parentWidth: 200, surface: "panel", compare: "shell", ignoreTags: true, boxClass: "text-[12px] leading-[normal] text-fg-2", noShot: FAKE_ART },
  // 시안 S04 문양 목록(내부선)의 첫 아이콘 · 고른 아이콘
  { id: "S04-31", part: "PatternIcon", variant: "md", parentWidth: 400, surface: "panel" },
  { id: "S04-32", part: "PatternIcon", variant: "md", state: "sel", parentWidth: 400, surface: "panel" },
  { id: "S04-33", part: "ZoneBands", parentWidth: 200, surface: "panel", boxClass: "relative h-[300px]", noMockup: "시안 띠는 사진 위 인라인 그림 — 따로 짝 표식 자리가 없음" },
  { id: "S06-31", part: "CompareView", variant: "side", parentWidth: 420, surface: "panel", noMockup: FAKE_ART },
  { id: "S06-32", part: "CompareView", variant: "slide", parentWidth: 420, surface: "panel", noMockup: FAKE_ART },
  { id: "S06-33", part: "PointPairs", variant: "crime", parentWidth: 200, surface: "panel", boxClass: "relative h-[300px]", noMockup: "시안 점 · 상자는 사진 위 인라인 그림 — 따로 짝 표식 자리가 없음" },
  // r2 — HeatOverlay: 시안은 매 호출 새 그라데이션 id 를 만드는 인라인 SVG(계산값의 url(#id)가 달라짐) + 가짜 그림 바탕이라 짝 대조 없음. 모양은 단위 테스트가 지킴
  { id: "S06-41", part: "HeatOverlay", variant: "match", parentWidth: 100, surface: "panel", boxClass: "relative h-[264px]", noMockup: "시안은 호출마다 그라데이션 id 가 달라지는 인라인 SVG + 가짜 그림 바탕 — " + FAKE_ART },
  { id: "S01-45", part: "HeatOverlay", variant: "spots", parentWidth: 100, surface: "panel", boxClass: "relative h-[264px]", noMockup: "시안은 밑창 그림 안에 들어 있는 그룹(별도 요소 아님) — " + FAKE_ART },
];

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
  { id: "S04-31", part: "PatternIcon", variant: "md", parentWidth: 400, surface: "panel", ignorePlacement: true /* 루트 position relative 는 필수 · 개수 배지의 기준 — 배치 */ },
  { id: "S04-32", part: "PatternIcon", variant: "md", state: "sel", parentWidth: 400, surface: "panel", noMockup: "대조 실패(남은 차이): 고름 글자 「선택됨」 sr-only 자식이 하나 더 있음(색 테만으로 구분하지 않으려는 의도) + 루트 position relative(필수 · 개수 배지의 기준)" },
  { id: "S04-33", part: "ZoneBands", parentWidth: 200, surface: "panel", boxClass: "relative h-[300px]", noMockup: "시안 띠는 사진 위 인라인 그림 — 따로 짝 표식 자리가 없음" },
  { id: "S06-31", part: "CompareView", variant: "side", parentWidth: 420, surface: "panel", noMockup: FAKE_ART },
  { id: "S06-32", part: "CompareView", variant: "slide", parentWidth: 420, surface: "panel", noMockup: FAKE_ART },
  { id: "S06-33", part: "PointPairs", variant: "crime", parentWidth: 200, surface: "panel", boxClass: "relative h-[300px]", noMockup: "시안 점 · 상자는 사진 위 인라인 그림 — 따로 짝 표식 자리가 없음" },
];

// ai 갈래 진열 예시의 「데이터」 부분(fixtures-meta.ts 와 같은 모양). PART_FIXTURES 에 이어 붙는다.
import type { PartFixture } from "./fixtures-meta"

export const AI_PART_FIXTURES: PartFixture[] = [
  // LiveDot — S01 「AI 사전 처리」 머리의 점
  { id: "S01-21", part: "LiveDot", variant: "busy", parentWidth: 200, surface: "ai", noMockup: "대조 실패(남은 차이): 부품은 점 + 보이는 글자(label)를 감싼 inline-flex 래퍼, 시안은 점 하나만 — 구조가 다름(의도: 글자 없는 색 점 금지, hideLabel 로 글자만 숨김)" },
  // AiProgress — S01 `.fx-bar.run`(62%) · 일반 `.fx-bar`(58%)
  { id: "S01-22", part: "AiProgress", variant: "running", parentWidth: 381, surface: "ai", ignoreTags: true },
  { id: "S01-23", part: "AiProgress", variant: "done", parentWidth: 211.66, surface: "panel", ignoreTags: true },
  // ConfidenceBar — S04 패턴 코드 목록의 「AI 확신도」(너비 80)
  { id: "S04-34", part: "ConfidenceBar", variant: "unit", state: "low", parentWidth: 80, surface: "panel", ignoreTags: true },
  { id: "S01-24", part: "ScanOverlay", parentWidth: 200, surface: "panel", boxClass: "relative h-[100px]", noMockup: "멈춘 모양이 안 보이는 선(top 100% · 불투명 0)이라 대조할 그림이 없음" },
  // r2 — StatTile: S01 현황 줄(시안 타일은 flex:1 · 줄 높이 98.38 로 늘어나는 flex 자식 — 상자를 높이 고정 grid 로 같게 만든다)
  { id: "S01-41", part: "StatTile", boxClass: "grid h-[98.38px] text-[14px] leading-[1.6]", parentWidth: 237.67, surface: "panel", ignoreTags: true },
  { id: "S01-42", part: "StatTile", variant: "warn", boxClass: "grid h-[98.38px] text-[14px] leading-[1.6]", parentWidth: 237.67, surface: "panel" },
  { id: "S01-43", part: "StatTile", boxClass: "grid h-[98.38px] text-[14px] leading-[1.6]", parentWidth: 237.67, surface: "panel", ignoreTags: true },
  // r2 — CheckList: 시안에는 줄(.check)만 있고 묶음 요소가 없어 짝 표식을 달 곳이 없다(줄 모양은 단위 테스트가 지킴)
  { id: "S02-41", part: "CheckList", parentWidth: 265, surface: "ai", noMockup: "시안은 .check 줄만 있고 묶음 요소가 없음 — 짝 표식 자리 없음" },
  { id: "S07-41", part: "CheckList", variant: "dense", parentWidth: 265, surface: "panel", noMockup: "시안은 .check 줄만 있고 묶음 요소가 없음 — 짝 표식 자리 없음" },
  // r2 — AiSuggestion: S03 오른쪽 칸 「AI 제안」 첫 줄
  { id: "S03-41", part: "AiSuggestion", parentWidth: 164, surface: "panel-2" },
]

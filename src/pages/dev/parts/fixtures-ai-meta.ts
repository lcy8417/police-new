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
]

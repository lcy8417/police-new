// ai 갈래 진열 예시의 「데이터」 부분(fixtures-meta.ts 와 같은 모양). 컨트롤러가 PART_FIXTURES 에 이어 붙인다.
// parentWidth 는 아직 시안에서 측정하지 않은 값(대조 전 확인 필요) — 노트 ai.md 참고.
import type { PartFixture } from "./fixtures-meta"

export const AI_PART_FIXTURES: PartFixture[] = [
  // LiveDot — S01 「AI 사전 처리」 머리의 점
  { id: "S01-21", part: "LiveDot", variant: "busy", parentWidth: 200, surface: "ai" },
  // AiProgress — S01 `.fx-bar.run`(62%) · 일반 `.fx-bar`(58%)
  { id: "S01-22", part: "AiProgress", variant: "running", parentWidth: 300, surface: "ai" },
  { id: "S01-23", part: "AiProgress", variant: "done", parentWidth: 300, surface: "panel" },
  // ConfidenceBar — S04 패턴 코드 목록의 「AI 확신도」(너비 80)
  { id: "S04-31", part: "ConfidenceBar", variant: "unit", state: "low", parentWidth: 80, surface: "panel" },
]

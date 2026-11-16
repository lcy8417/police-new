import type { ReactNode } from "react"

import { AiProgress, ConfidenceBar, LiveDot, ScanOverlay } from "@/shared/ui/ai"

// ai 갈래 진열 예시를 그리는 쪽(fixtures.tsx 와 같은 모양). 데이터는 fixtures-ai-meta.ts. 컨트롤러가 FIXTURE_RENDERS 에 합친다.
export const AI_FIXTURE_RENDERS: Record<string, () => ReactNode> = {
  "S01-21": () => <LiveDot state="busy" label="AI 사전 처리 중" hideLabel partId="S01-21" />,
  "S01-22": () => <AiProgress state="running" value={0.62} label="AI 사전 처리" partId="S01-22" />,
  "S01-23": () => <AiProgress state="done" value={0.58} label="결과 확인" partId="S01-23" />,
  "S04-34": () => (
    <ConfidenceBar value={0.42} scale="unit" threshold={0.5} label="AI 확신도" partId="S04-34" />
  ),
  "S01-24": () => <ScanOverlay active partId="S01-24" />,
}

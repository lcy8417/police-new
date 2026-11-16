import type { ReactNode } from "react"

import { AiProgress, AiSuggestion, CheckList, ConfidenceBar, LiveDot, ScanOverlay, StatTile } from "@/shared/ui/ai"
import { Button, Chip } from "@/shared/ui/kit"

// ai 갈래 진열 예시를 그리는 쪽(fixtures.tsx 와 같은 모양). 데이터는 fixtures-ai-meta.ts. 컨트롤러가 FIXTURE_RENDERS 에 합친다.
export const AI_FIXTURE_RENDERS: Record<string, () => ReactNode> = {
  "S01-21": () => <LiveDot state="busy" label="AI 사전 처리 중" hideLabel partId="S01-21" />,
  "S01-22": () => <AiProgress state="running" value={0.62} label="AI 사전 처리" partId="S01-22" />,
  "S01-23": () => <AiProgress state="done" value={0.58} label="결과 확인" partId="S01-23" />,
  "S04-34": () => (
    <ConfidenceBar value={0.42} scale="unit" threshold={0.5} label="AI 확신도" partId="S04-34" />
  ),
  "S01-24": () => <ScanOverlay active partId="S01-24" />,
  // StatTile — 안쪽 막대는 S01-23 과 같은 부품(id 는 그쪽이 가지므로 여기서는 달지 않는다)
  "S01-41": () => (
    <StatTile partId="S01-41" label="결과 확인 전" value="14" unit="건" sub="이미지 98장 중 확인 57장">
      <AiProgress state="done" value={0.58} label="결과 확인" />
    </StatTile>
  ),
  "S01-42": () => (
    <StatTile partId="S01-42" tone="warn" label="교차 검증 요청 받음" value="1" unit="건" sub="00001-25-0646 · 김○○ → 나" />
  ),
  "S01-43": () => (
    <StatTile partId="S01-43" glow="brand" label="이미지 미검색" value="9" unit="장" sub="AI Top-10 준비 7 · 대기 2">
      <AiProgress state="done" value={0.78} label="Top-10 준비" />
    </StatTile>
  ),
  // CheckList — S02 「AI 1차 작업 점검」 · S07 「AI 근거」 줄
  "S02-41": () => (
    <CheckList
      partId="S02-41"
      items={[
        { tone: "warn", text: <>같은 사진 의심 <b className="font-code">_4 ↔ _5</b></>, detail: "크기·그림 98% 같음", action: <Button size="sm">_5 삭제</Button> },
        { tone: "warn", text: <>전사판 사진 <b className="font-code">_2 _7</b></>, detail: "좌우반전 필요", action: <Button size="sm">반전 적용</Button> },
        { tone: "bad", text: <>흐린 사진 <b className="font-code">_9</b></>, detail: "윤곽 판독 어려움 · 재촬영 요청?", action: <Chip variant="h19" className="text-[10px]">보류</Chip> },
        { tone: "ok", text: "자 인식 11/12장 · 기울기 보정값 준비" },
      ]}
    />
  ),
  "S07-41": () => (
    <CheckList
      partId="S07-41"
      dense
      className="text-fg-2"
      items={[
        { tone: "ok", text: "상 부위 줄무늬 수 일치" },
        { tone: "warn", text: "마모·흠 같은 개별 특징", icon: "·" },
      ]}
    />
  ),
  // AiSuggestion — S03 「기울기 맞추기」
  "S03-41": () => (
    <AiSuggestion partId="S03-41" title="기울기 맞추기" reason="족적 축 −4.2°" actionLabel="맞추기" onApply={() => {}} />
  ),
}

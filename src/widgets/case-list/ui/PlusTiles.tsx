import { FEATURES, type FeatureCode } from "@/entities/session"
import { AiProgress, LiveDot, StatTile } from "@/shared/ui/ai"

import type { CaseListAiPrep, CaseListTasks } from "../model/types"

// (+α) 검색 폼 아래 타일 줄: 「AI 사전 처리」 + 역할별 할 일 숫자(시안 S01 핀 12). 전체가 +α 라 호출하는 쪽이 showPlus 로 감싼다.
// 시안 data-role → 권한 코드: analyst admin = EXAM_DECIDE · 교차 검증 = CROSS_REVIEW · 결재 대기 = REPORT_APPROVE ·
// 우리 청 의뢰(investigator) = 조회 권한 없이 사건 현황만 보는 사람.

interface PlusTilesProps {
  isAdmin: boolean
  features: readonly FeatureCode[]
  aiPrep?: CaseListAiPrep
  tasks?: CaseListTasks
}

export function PlusTiles({ isAdmin, features, aiPrep, tasks }: PlusTilesProps) {
  const has = (code: FeatureCode) => isAdmin || features.includes(code)
  const analyst = has(FEATURES.EXAM_DECIDE)
  const investigator =
    !isAdmin && features.includes(FEATURES.CASE_STATUS_VIEW) && !features.includes(FEATURES.CRIME_SEARCH)
  const ratio = (n: number, d: number) => (d > 0 ? n / d : 0)

  return (
    <div data-plus className="flex gap-[10px] border-t border-solid border-line-2 px-[14px] py-[12px]">
      {analyst && aiPrep ? (
        <StatTile
          tone="ai"
          glow="ai"
          className="min-w-0 flex-[1.8]"
          sub={`이진화 ${aiPrep.binarized}/${aiPrep.imageCount} · 문양 제안 ${aiPrep.suggested}/${aiPrep.imageCount} · 검색 Top-10 준비 ${aiPrep.top10}/${aiPrep.imageCount} — 감정관이 열기 전에 미리`}
        >
          <span className="flex items-center gap-[7px]">
            <LiveDot state="busy" label="AI 사전 처리 진행 중" hideLabel partId="S01-21" />
            <b className="text-[12px] text-ai">AI 사전 처리</b>
            <span className="ml-auto font-code text-[10.5px] text-dim">{aiPrep.receivedAt} 공문 접수</span>
          </span>
          <span className="flex items-baseline gap-[8px]">
            <span className="font-code text-[22px] font-bold leading-none tabular-nums text-foreground">
              {aiPrep.aprthngNo}
            </span>
            <span className="text-[11.5px] text-muted-foreground">{aiPrep.imageCount}장</span>
          </span>
          <AiProgress
            state="running"
            value={ratio(aiPrep.top10, aiPrep.imageCount) + 0.04}
            label="AI 사전 처리 진행"
            partId="S01-22"
          />
        </StatTile>
      ) : null}
      {tasks ? (
        <StatTile
          partId="S01-41"
          className="min-w-0 flex-1"
          label="결과 확인 전"
          value={tasks.awaitingResult.cases}
          unit="건"
          sub={`이미지 ${tasks.awaitingResult.imagesTotal}장 중 확인 ${tasks.awaitingResult.imagesChecked}장`}
        >
          <AiProgress
            state="done"
            value={ratio(tasks.awaitingResult.imagesChecked, tasks.awaitingResult.imagesTotal)}
            label="이미지 확인 비율"
            partId="S01-23"
          />
        </StatTile>
      ) : null}
      {tasks && analyst ? (
        <StatTile
          partId="S01-43"
          className="min-w-0 flex-1"
          glow="brand"
          label="이미지 미검색"
          value={tasks.unsearched.images}
          unit="장"
          sub={`AI Top-10 준비 ${tasks.unsearched.ready} · 대기 ${tasks.unsearched.waiting}`}
        >
          <AiProgress state="done" value={0.78} label="AI Top-10 준비 비율" />
        </StatTile>
      ) : null}
      {tasks && has(FEATURES.CROSS_REVIEW) ? (
        <StatTile
          partId="S01-42"
          className="min-w-0 flex-1"
          tone="warn"
          label="교차 검증 요청 받음"
          value={tasks.crossRequest.count}
          unit="건"
          sub={tasks.crossRequest.detail}
        />
      ) : null}
      {tasks && has(FEATURES.REPORT_APPROVE) ? (
        <StatTile
          className="min-w-0 flex-1"
          label="결재 대기"
          value={tasks.approval.count}
          unit="건"
          sub={tasks.approval.detail}
        />
      ) : null}
      {tasks && investigator ? (
        <StatTile
          className="min-w-0 flex-1"
          label="우리 청 의뢰"
          value={tasks.ours.count}
          unit="건"
          sub={tasks.ours.detail}
        />
      ) : null}
    </div>
  )
}

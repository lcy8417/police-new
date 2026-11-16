import * as React from "react"

import { AiTag } from "@/shared/ui/ai"
import { Button } from "@/shared/ui/kit"

import type { ResultDetailInsight } from "../model/types"
import { SoleHeat } from "./SoleHeat"

// 시안 S05 아래 칸 「현장문양검색결과 상세조회」(SCAS 3번째 팝업 → 같은 레이어 아래 칸).
// 버튼 줄은 SCAS 순서(이전 · 다음 · 그룹등록 · 확인대상 · 프린트 · 닫기) + 구분선 뒤 「크게 보기(뷰어)」.
// 알림 창 대신 칸 안 확인 막대 「확인대상에 등록하시겠습니까?」(예 = 확인대상 넣기).

const CELL = "min-h-[30px] border-b border-solid border-line-2 px-[8px] py-[5px] text-[12.5px]"

export function ResultDetail({
  detail,
  canWrite,
  onRegister,
  onAction,
  onClose,
}: {
  detail: ResultDetailInsight
  /** 그룹등록 · 확인대상 — 감정관 · 관리자 */
  canWrite: boolean
  /** 확인 막대 「예」 — 확인대상에 넣기 */
  onRegister: () => void
  /** 동작이 아직 없는 버튼 */
  onAction: (label: string) => void
  onClose: () => void
}) {
  const [asking, setAsking] = React.useState(true)
  // 2열로 흐르는 라벨-값 표, 칸 수가 홀수면 빈 칸 한 쌍을 채운다(시안처럼)
  const cells = detail.info.length % 2 === 0 ? detail.info : [...detail.info, ["", ""] as const]
  return (
    <section data-plus data-result-detail aria-label="현장문양검색결과 상세조회" className="mt-[4px]">
      <div className="flex min-h-[30px] flex-wrap items-center gap-[8px] border-l-[3px] border-solid border-brand-2 bg-panel-3 px-[10px] text-[12.5px] font-semibold">
        현장문양검색결과 상세조회
        <span className="ml-[4px] font-code font-normal text-muted-foreground">{`${detail.rank}위 · ${detail.similarity.toFixed(1)}%`}</span>
        <span className="ml-auto flex items-center gap-[6px] font-normal">
          <span className="inline-flex gap-[5px]">
            <Button size="sm" onClick={() => onAction("이전")}>
              이전
            </Button>
            <Button size="sm" onClick={() => onAction("다음")}>
              다음
            </Button>
            <Button size="sm" locked={!canWrite} onClick={() => onAction("그룹등록")}>
              그룹등록
            </Button>
            <Button
              size="sm"
              variant="ok"
              locked={!canWrite}
              className="[box-shadow:inset_0_0_0_1px_var(--t-ok-fg)]"
              onClick={() => setAsking(true)}
            >
              확인대상
            </Button>
            <Button size="sm" onClick={() => onAction("프린트")}>
              프린트
            </Button>
            <Button size="sm" onClick={onClose}>
              닫기
            </Button>
          </span>
          <span aria-hidden="true" className="h-[18px] w-px bg-line-3" />
          <Button size="sm" onClick={() => onAction("크게 보기(뷰어)")}>
            크게 보기(뷰어)
          </Button>
        </span>
      </div>
      <div className="grid grid-cols-[150px_150px_190px_minmax(0,1fr)] gap-[10px] pt-[10px]">
        <div className="grid gap-[3px] text-[11px] text-muted-foreground">
          유류 이미지
          <span className="relative block h-[150px] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas">
            <img src={detail.crimeImage} alt="유류 이미지" className="block size-full object-cover" />
          </span>
        </div>
        <div className="grid gap-[3px] text-[11px] text-muted-foreground">
          <span className="flex items-center">
            발견 이미지
            <AiTag className="ml-auto h-[15px] text-[9px]">일치 부위 켬</AiTag>
          </span>
          <span className="relative block h-[150px] overflow-hidden rounded-[10px] border border-solid border-border bg-paper">
            <img src={detail.shoeImage} alt={`발견 이미지 ${detail.ftwrId}`} className="block size-full object-contain" />
            <SoleHeat />
          </span>
        </div>
        <div className="grid gap-[3px] text-[11px] text-muted-foreground">
          측면 이미지
          <span className="relative block h-[150px] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas">
            <img src={detail.sideImage} alt="측면 이미지" className="block size-full object-contain" />
          </span>
        </div>
        <div className="grid min-w-0 content-start gap-[8px]">
          <div className="grid grid-cols-[72px_minmax(0,1fr)_72px_minmax(0,1fr)] border-t border-solid border-line-2">
            {cells.map(([label, value], i) => (
              <React.Fragment key={`${label}-${i}`}>
                <div className={`${CELL} bg-strip text-muted-foreground`}>{label}</div>
                <div className={`${CELL} min-w-0 break-keep text-fg-2`}>{value}</div>
              </React.Fragment>
            ))}
          </div>
          {asking && canWrite ? (
            <div
              data-confirm-bar
              className="flex items-center gap-[8px] rounded-[8px] border border-solid border-brand-line bg-brand-bg px-[10px] py-[7px] text-[12px]"
            >
              확인대상에 등록하시겠습니까?
              <span className="ml-auto flex gap-[5px]">
                <Button
                  size="sm"
                  variant="pri"
                  onClick={() => {
                    onRegister()
                    setAsking(false)
                  }}
                >
                  예
                </Button>
                <Button size="sm" onClick={() => setAsking(false)}>
                  아니오
                </Button>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

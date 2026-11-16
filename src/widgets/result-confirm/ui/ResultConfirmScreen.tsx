import { Fragment, type ReactNode } from "react"

import type { CrimeHistoryRow } from "@/entities/crime"
import type { FeatureCode } from "@/entities/session"
import { Button, DataGrid, InlineError, RadioRow, type DataGridColumn } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"
import { EvidenceImage } from "@/shared/ui/viewer"

import type { ConfirmImageBlock, ConfirmTarget, Judgement, ResultConfirmScreenProps } from "../model/types"

// S07 검색결과 확인(F28 발견/불발견 판정 → 이력 저장). SCAS 「검색결과 확인」 배치: 위 사건 요약표, 「검색이력」 띠,
// 이미지 블록마다 왼쪽 이미지번호 · 사진, 가운데 이력표, 오른쪽 판정 · 확인대상 상자. 판정은 이미지마다 따로(지금 저장 단위).
// 판정 값은 제어형(judgements). 감정불능 · AI 추천 · 판정 메모 · 확인 막대 · 교차 검증 요청은 담지 않는다(노트 screens-result.md).

const OPTIONS: { value: Judgement; label: string }[] = [
  { value: "found", label: "발견" },
  { value: "notFound", label: "불발견" },
]

// 판정 저장은 지금 앱에서 사건 조회 권한 묶음(CRIME_SEARCH) 안에 있다
const WRITE_FEATURE: FeatureCode = "CRIME_SEARCH"

// 이력표 — 지금 이력 필드(검색 번호 · 순위 · 매칭 신발 · 등록 일시). SCAS 처럼 검색번호를 앞, 검색일을 끝에 둔다.
const HISTORY_COLUMNS: DataGridColumn<CrimeHistoryRow>[] = [
  { key: "searchNo", header: "검색번호", render: (r) => <span className="font-code tabular-nums">{r.searchNo}</span> },
  { key: "ranking", header: "순위", align: "right", render: (r) => <span className="font-code tabular-nums">{r.ranking}</span> },
  {
    key: "mtchgId",
    header: "매칭 신발",
    render: (r) => (r.mtchgId ? <span className="font-code">{r.mtchgId}</span> : <span className="text-dim">매칭 없음</span>),
  },
  { key: "frstRegistDt", header: "검색일", render: (r) => <span className="font-code tabular-nums text-muted-foreground">{r.frstRegistDt}</span> },
]

/** 퍼센트(0~100) 그대로 반올림 — 69.99 → 「70%」. 숫자가 아니면 「—」 */
function formatPercent(similarity: number | string): string {
  const value = typeof similarity === "number" ? similarity : Number.parseFloat(similarity)
  return Number.isFinite(value) ? `${Math.round(Math.min(100, Math.max(0, value)))}%` : "—"
}

function TargetCard({ target }: { target: ConfirmTarget }) {
  return (
    <div className="flex items-center gap-[10px]">
      <span className="relative block h-[96px] w-[64px] flex-none overflow-hidden rounded-[6px] bg-foreground">
        <img src={target.image} alt={`신발 ${target.ftwrId} 밑창`} className="block size-full object-contain" />
      </span>
      <span className="grid min-w-0 gap-[2px] text-[11.5px]">
        <b className="truncate font-code text-foreground">{`No. ${target.ftwrId}`}</b>
        <span className="font-code tabular-nums text-muted-foreground">{`#${target.ranking}`}</span>
        <span className="font-code tabular-nums text-fg-2">{formatPercent(target.similarity)}</span>
      </span>
    </div>
  )
}

function ImageBlock({
  block,
  value,
  canWrite,
  onChange,
  onSave,
}: {
  block: ConfirmImageBlock
  value: Judgement | null
  canWrite: boolean
  onChange: (result: Judgement) => void
  onSave: (target: ConfirmTarget, result: Judgement) => void
}) {
  const { target } = block
  const locked = !canWrite || target === null
  return (
    <section
      data-image-block
      aria-label={`${block.aprthngNo} 검색결과`}
      className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)_300px] gap-[12px] border-b border-solid border-line-2 px-[14px] py-[10px]"
    >
      <div className="grid content-start gap-[6px]">
        <span data-block-title className="font-code text-[12px] text-foreground">
          {block.aprthngNo}
        </span>
        <EvidenceImage src={block.sceneImage} alt={`${block.aprthngNo} 현장 족적`} />
      </div>
      <div className="min-w-0">
        <DataGrid columns={HISTORY_COLUMNS} rows={[...block.history]} rowKey={(r) => String(r.searchNo)} emptyText="검색 이력 없음" />
      </div>
      <div className="grid content-start gap-[8px]">
        <div className="flex items-center justify-between gap-[8px]">
          <RadioRow
            name={`${block.aprthngNo} 판정`}
            options={OPTIONS}
            value={value}
            onValueChange={(v) => onChange(v as Judgement)}
            disabled={locked}
            className="text-[12.5px]"
          />
          <Button
            size="sm"
            variant="pri"
            disabled={locked || value === null}
            onClick={() => {
              if (target && value) onSave(target, value)
            }}
          >
            결과확인완료
          </Button>
        </div>
        <div className="min-h-[60px] rounded-[10px] border border-solid border-border bg-panel-2 p-[8px]">
          <div className="mb-[6px] text-[11.5px] text-muted-foreground">확인대상</div>
          {target ? <TargetCard target={target} /> : <span className="text-[12px] text-dim">확인대상 없음</span>}
        </div>
      </div>
    </section>
  )
}

export function ResultConfirmScreen({
  status,
  errorAt,
  onRetry,
  isAdmin,
  features,
  caseSummary,
  blocks,
  judgements,
  onJudgementChange,
  onSaveJudgement,
}: ResultConfirmScreenProps) {
  const canWrite = isAdmin || features.includes(WRITE_FEATURE)
  const summary: [string, string][] = [
    ["감정번호", caseSummary.apprslReqestNo ?? ""],
    ["범죄명", caseSummary.crimeNm ?? ""],
    ["의뢰관서", caseSummary.rqestGrfcNm ?? ""],
  ]

  let body: ReactNode
  if (status === "loading") {
    body = (
      <div aria-busy="true" className="grid min-h-[240px] place-content-center text-[12px] text-muted-foreground">
        검색 결과를 불러오는 중
      </div>
    )
  } else if (status === "error") {
    body = (
      <div className="grid min-h-[240px] place-content-center">
        <InlineError message="검색 결과를 확인 못 함" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else if (status === "empty") {
    body = (
      <div className="grid min-h-[240px] place-content-center justify-items-center gap-[4px] text-[12.5px] text-muted-foreground">
        <span className="font-semibold text-fg-2">결과 없음</span>
        <span className="text-[11.5px] text-dim">이 사건에 확인할 검색 결과가 없습니다</span>
      </div>
    )
  } else {
    body = blocks.map((block) => (
      <ImageBlock
        key={block.aprthngNo}
        block={block}
        value={judgements[block.aprthngNo] ?? null}
        canWrite={canWrite}
        onChange={(result) => onJudgementChange(block.aprthngNo, result)}
        onSave={(target, result) => onSaveJudgement({ aprthngNo: block.aprthngNo, ftwrId: target.ftwrId, result })}
      />
    ))
  }

  return (
    <Panel title="검색결과 확인" className="min-w-0">
      <div className="px-[14px] pt-[10px] pb-[4px]">
        <table className="w-full border-collapse border-t border-solid border-line-2 text-[12.5px]">
          <tbody>
            <tr>
              {summary.map(([label, value]) => (
                <Fragment key={label}>
                  <th
                    scope="row"
                    className="w-[84px] border-b border-solid border-line-2 bg-strip px-[10px] py-[6px] text-left text-[12px] font-normal whitespace-nowrap text-muted-foreground"
                  >
                    {label}
                  </th>
                  <td className="border-b border-solid border-line-2 px-[10px] py-[6px] break-all text-fg-2">
                    <span className={label === "감정번호" ? "font-code" : undefined}>{value}</span>
                  </td>
                </Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mx-[14px] mt-[8px] flex h-[32px] items-center rounded-[8px] bg-brand-3 px-[12px] text-[12.5px] font-semibold text-white">
        검색이력
      </div>
      <div className="min-w-0">{body}</div>
    </Panel>
  )
}

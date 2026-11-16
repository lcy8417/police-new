import * as React from "react"

import type { FeatureCode } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { ConfidenceBar } from "@/shared/ui/ai"
import { Button, DialogShell, InlineError, Segmented } from "@/shared/ui/kit"
import { ButtonBar, Panel } from "@/shared/ui/panel"
import { PatternIcon, PointPairs, type PointPairBox } from "@/shared/ui/viewer"

import type { MatchCompareScreenProps, MatchImage, ZonePatterns } from "../model/types"

// S06 상세 조회 · 정밀 대조(F25 정렬 설정 · F26 Top-10 대응 매칭 · F27 RGB ↔ 스케치·이진).
// SCAS 「현장문양검색결과 상세조회」 배치: 머리 버튼 줄(이전 · 다음 · 그룹등록 · 확인대상 · 프린트 · 닫기 — 새 「정렬 설정」은 맨 끝),
// 유류 | 발견 이미지, 사건정보 | 신발정보 표, 아래 문양 비교. 대응 박스는 match_top10 의 MatchBox 만큼만 그린다(spec §6-1).
// 정렬 캔버스는 슬롯(alignmentSlot)이다 — 좌표 수학은 운영 캔버스가 소유. 호버 · 보기 방식 · 대화상자 열림은 저장하지 않는 위젯 안 상태.
// 시안 +α(대응점 39 · 구역 선 · 겹쳐 보기 · 히트맵 · 지표 4개 · 종합 신뢰도 · 부위별 근거 · AI 미리 대조)는 담지 않는다.

type Look = "rgb" | "sketch"

const LOOK_ITEMS = [
  { value: "rgb", label: "RGB" },
  { value: "sketch", label: "스케치·이진" },
]

const NO_ALIGNMENT = "정렬(ROI+방향)이 설정되지 않았습니다. 먼저 정렬을 저장해 주세요."
const NOT_READY = "준비 중"
// 판정 · 정렬 저장은 지금 앱에서 사건 조회 권한 묶음(CRIME_SEARCH) 안에 있다
const WRITE_FEATURE: FeatureCode = "CRIME_SEARCH"

const ZONE_ROWS: { key: keyof ZonePatterns; label: string }[] = [
  { key: "top", label: "상" },
  { key: "mid", label: "중" },
  { key: "bottom", label: "하" },
  { key: "outline", label: "윤곽" },
]

/** REQ-ALIGN-007c 「정렬 설정됨」: polygon · arrow 둘 다 있음 */
function isAlignmentSet(alignment: MatchCompareScreenProps["alignment"]): boolean {
  return alignment != null && alignment.polygon != null && alignment.arrow != null
}

/** 채취 일시 `YYYY-MM-DDTHH:MM:SS` → `YYYY-MM-DD HH:MM` */
function formatPickDt(value: string | null | undefined): string {
  return value ? value.replace("T", " ").slice(0, 16) : ""
}

function MatchPane({
  label,
  image,
  look,
  boxes,
  side,
  activeIndex,
  onActive,
}: {
  label: string
  image: MatchImage
  look: Look
  boxes: PointPairBox[]
  side: "crime" | "shoe"
  activeIndex: number | null
  onActive: (index: number | null) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[4px]">
      <span className="rounded-[4px] bg-strip px-[6px] py-[3px] text-[11.5px] text-muted-foreground">{label}</span>
      <div
        data-match-image={side}
        data-look={look}
        className="relative h-[340px] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas"
      >
        {/* object-contain 과 PointPairs(viewBox meet)가 같은 비율로 맞춰진다 */}
        <img src={look === "rgb" ? image.rgb : image.sketch} alt={label} className="block size-full object-contain" />
        <PointPairs
          boxes={boxes}
          side={side}
          activeIndex={activeIndex}
          onHover={onActive}
          onSelect={onActive}
          width={image.width}
          height={image.height}
          aria-label={`${label} 대응 박스`}
        />
      </div>
    </div>
  )
}

function PatternColumn({ title, patterns }: { title: string; patterns: ZonePatterns }) {
  return (
    <div className="rounded-[10px] border border-solid border-border px-[10px] py-[6px]">
      <div className="mb-[2px] text-center text-[12px] text-muted-foreground">{title}</div>
      {ZONE_ROWS.map((z) => (
        <div
          key={z.key}
          className="grid grid-cols-[34px_minmax(0,1fr)] items-center gap-[6px] border-t border-solid border-line-2 py-[3px]"
        >
          <span className="text-[12px] text-muted-foreground">{z.label}</span>
          <span className="flex min-w-0 flex-wrap gap-[4px]">
            {patterns[z.key].length === 0 ? (
              <span className="text-[11.5px] text-faint">—</span>
            ) : (
              patterns[z.key].map((p) => <PatternIcon key={p.name} name={p.name} src={p.src} size="sm" />)
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

export function MatchCompareScreen({
  status,
  errorAt,
  onRetry,
  isAdmin,
  features,
  ranking,
  alignment,
  matches,
  crimeImage,
  shoeImage,
  caseInfo,
  shoeInfo,
  crimePatterns,
  shoePatterns,
  alignmentSlot,
  onSaveAlignment,
  onConfirmTarget,
  onClose,
}: MatchCompareScreenProps) {
  const canWrite = isAdmin || features.includes(WRITE_FEATURE)
  const [look, setLook] = React.useState<Look>("rgb")
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const [alignOpen, setAlignOpen] = React.useState(false)
  const aligned = isAlignmentSet(alignment)

  const crimeBoxes = React.useMemo(() => matches.map((m) => m.box), [matches])
  // 신발 쪽은 대응점(sx, sy)에 같은 크기의 박스(지금 응답에는 신발 쪽 박스가 따로 없다)
  const shoeBoxes = React.useMemo(() => matches.map((m) => ({ cx: m.sx, cy: m.sy, size: m.box.size })), [matches])

  const caseRows: [string, string][] = [
    ["이미지번호", caseInfo.aprthngNo ?? ""],
    ["의뢰관서", caseInfo.rqestGrfcNm ?? ""],
    ["사건명", caseInfo.crimeNm ?? ""],
    ["채취일시", formatPickDt(caseInfo.pickDt)],
    ["채취장소", caseInfo.pickPlace ?? ""],
  ]
  const shoeRows: [string, string][] = [
    ["화류번호", shoeInfo.ftwrId],
    ["제조사", shoeInfo.makrCode ?? ""],
    ["상표명", shoeInfo.brandCode ?? ""],
    ["모델번호", shoeInfo.modlNm ?? ""],
    ["수집년도", shoeInfo.colctYear ?? ""],
    ["그룹명", shoeInfo.ftwrGroupNm ?? ""],
  ]
  const infoLength = Math.max(caseRows.length, shoeRows.length)

  const buttons = (
    <ButtonBar variant="modal-head">
      {/* 이전 · 다음 · 그룹등록 · 프린트는 지금 앱에 없는 동작 — SCAS 자리만 지키고 비활성 */}
      <span title={NOT_READY} className="inline-flex">
        <Button size="sm" disabled>
          이전
        </Button>
      </span>
      <span title={NOT_READY} className="inline-flex">
        <Button size="sm" disabled>
          다음
        </Button>
      </span>
      <span title={NOT_READY} className="inline-flex">
        <Button size="sm" disabled>
          그룹등록
        </Button>
      </span>
      <Button size="sm" variant="warn" disabled={!canWrite} onClick={onConfirmTarget}>
        확인대상
      </Button>
      <span title={NOT_READY} className="inline-flex">
        <Button size="sm" disabled>
          프린트
        </Button>
      </span>
      <Button size="sm" onClick={onClose}>
        닫기
      </Button>
      <span aria-hidden="true" className="mx-[3px] h-[18px] w-px bg-line-3" />
      <Button size="sm" onClick={() => setAlignOpen(true)}>
        정렬 설정
      </Button>
    </ButtonBar>
  )

  let compare: React.ReactNode
  if (!aligned) {
    compare = (
      <div className="grid min-h-[340px] place-content-center justify-items-center gap-[10px] rounded-[10px] border border-dashed border-line-3 bg-panel-2 p-[20px] text-center">
        <span className="text-[12.5px] text-fg-2">{NO_ALIGNMENT}</span>
        <Button size="sm" variant="pri" onClick={() => setAlignOpen(true)}>
          정렬 설정하러 가기
        </Button>
      </div>
    )
  } else {
    compare = (
      <div className="grid min-w-0 gap-[8px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-[11.5px] text-dim">대응 박스 {matches.length}개 · 번호가 같은 박스끼리 짝</span>
          <Segmented
            items={LOOK_ITEMS}
            value={look}
            onValueChange={(v) => setLook(v as Look)}
            aria-label="보기 방식"
            className="ml-auto"
          />
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-[10px]">
          <MatchPane
            label="유류 이미지"
            image={crimeImage}
            look={look}
            boxes={crimeBoxes}
            side="crime"
            activeIndex={activeIndex}
            onActive={setActiveIndex}
          />
          <MatchPane
            label="발견 이미지"
            image={shoeImage}
            look={look}
            boxes={shoeBoxes}
            side="shoe"
            activeIndex={activeIndex}
            onActive={setActiveIndex}
          />
        </div>
        <ol aria-label="대응 목록" className="grid grid-cols-2 gap-x-[12px] text-[11.5px]">
          {matches.map((m, i) => (
            <li
              key={i}
              data-pair-row={i}
              data-active={activeIndex === i ? "true" : undefined}
              tabIndex={0}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(i)}
              onBlur={() => setActiveIndex(null)}
              className={cn(
                "grid grid-cols-[22px_minmax(0,1fr)_110px] items-center gap-[8px] border-b border-solid border-line-2 px-[4px] py-[4px] outline-none",
                activeIndex === i && "bg-brand-bg",
              )}
            >
              <b className="font-code tabular-nums text-foreground">{i + 1}</b>
              <span className="truncate font-code tabular-nums text-muted-foreground">
                {`현장 (${Math.round(m.fx)}, ${Math.round(m.fy)}) ↔ 신발 (${Math.round(m.sx)}, ${Math.round(m.sy)})`}
              </span>
              <ConfidenceBar value={m.score} scale="unit" label={`대응 ${i + 1} 점수`} />
            </li>
          ))}
        </ol>
      </div>
    )
  }

  let body: React.ReactNode
  if (status === "loading") {
    body = (
      // 움직임은 F14 · F17 · F23 에만 쓴다(spec §7) — 대응 계산 대기는 움직이지 않는 글자만 둔다
      <div
        aria-busy="true"
        role="status"
        className="grid min-h-[360px] place-content-center justify-items-center gap-[10px] text-[12px] text-muted-foreground"
      >
        <span>대응점 계산 중</span>
      </div>
    )
  } else if (status === "error") {
    body = (
      <div className="grid min-h-[360px] place-content-center">
        <InlineError message="대응 매칭을 확인 못 함" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else {
    body = (
      <div className="grid min-w-0 gap-[10px]">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_340px] gap-[12px]">
          {compare}
          <table className="h-fit w-full border-collapse text-[11.5px]">
            <thead>
              <tr>
                <th colSpan={2} className="border border-solid border-line-2 bg-strip px-[6px] py-[3px] text-center text-fg-2">
                  사건정보
                </th>
                <th colSpan={2} className="border border-solid border-line-2 bg-strip px-[6px] py-[3px] text-center text-fg-2">
                  신발정보
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: infoLength }, (_, i) => (
                <tr key={i}>
                  {[caseRows[i], shoeRows[i]].map((cell, j) => (
                    <React.Fragment key={j}>
                      <th
                        scope="row"
                        className="border border-solid border-line-2 bg-strip px-[6px] py-[3px] text-left font-normal whitespace-nowrap text-muted-foreground"
                      >
                        {cell?.[0] ?? ""}
                      </th>
                      <td className="border border-solid border-line-2 px-[6px] py-[3px] break-keep [overflow-wrap:anywhere] text-fg-2">
                        {cell ? <span className={cn(/\d{4}/.test(cell[1]) && "font-code")}>{cell[1]}</span> : null}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-[10px]">
          <PatternColumn title="유류 이미지 문양" patterns={crimePatterns} />
          <PatternColumn title="발견 이미지 문양" patterns={shoePatterns} />
        </div>
      </div>
    )
  }

  return (
    <>
      <Panel
        className="min-w-0"
        title="현장문양검색결과 상세조회"
        actions={
          <>
            <span className="inline-flex gap-[6px] font-code text-[12px] text-muted-foreground">
              <span className="text-fg-2">{`No. ${shoeInfo.ftwrId}`}</span>
              {ranking != null ? <span className="tabular-nums">{`#${ranking}`}</span> : null}
            </span>
            {buttons}
          </>
        }
      >
        <div className="p-[12px_14px_14px]">{body}</div>
      </Panel>

      <DialogShell
        open={alignOpen}
        onOpenChange={setAlignOpen}
        title="정렬 설정"
        size="large"
        actions={
          <Button
            size="sm"
            variant="pri"
            disabled={!canWrite}
            onClick={() => {
              onSaveAlignment()
              setAlignOpen(false)
            }}
          >
            정렬 저장
          </Button>
        }
      >
        <div className="grid gap-[8px] p-[12px_14px_14px]">
          <span className="text-[12px] text-muted-foreground">
            관심영역(ROI)을 다각형으로 두르고 앞코 방향 화살표를 그린 뒤 저장합니다. 저장해야 대응 매칭을 볼 수 있습니다.
          </span>
          <div className="relative h-[460px] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas">
            {alignmentSlot}
          </div>
        </div>
      </DialogShell>
    </>
  )
}

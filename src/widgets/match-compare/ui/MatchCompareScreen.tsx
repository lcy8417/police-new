import * as React from "react"

import type { FeatureCode } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { AiTag, ConfidenceBar } from "@/shared/ui/ai"
import { AutoPlayControl, Button, Chip, DialogShell, InlineError, Segmented, ViewCountSwitch } from "@/shared/ui/kit"
import { ButtonBar, Panel } from "@/shared/ui/panel"
import { PatternIcon } from "@/shared/ui/viewer"

import { viewerRoles } from "../model/roles"
import type { CompareCount, MatchCompareScreenProps, ZonePatterns } from "../model/types"
import { useStepClock, type StepDir } from "../model/use-step-clock"
import { MultiStage } from "./MultiStage"
import { PairStage } from "./PairStage"
import { PrecisionPanel } from "./PrecisionPanel"

// S06 상세 조회 · 정밀 대조(F25 정렬 설정 · F26 Top-10 대응 매칭 · F27 RGB ↔ 스케치·이진).
// SCAS 「현장문양검색결과 상세조회」 배치: 버튼 줄(이전 · 다음 · 그룹등록 · 확인대상 · 프린트 · 닫기 — 새 「정렬 설정」은 맨 끝),
// 유류 | 발견 이미지, 사건정보 | 신발정보 표, 아래 문양 비교. 대응 박스는 match_top10 의 MatchBox 만큼만 그린다(spec §6-1).
// 정렬 캔버스는 슬롯(alignmentSlot)이다 — 좌표 수학은 운영 캔버스가 소유. 호버 · 보기 방식 · 대화상자 열림은 저장하지 않는 위젯 안 상태.
// r2: 시안 r3 +α(AI 대응점 39 · 구역 선 · AI 정합 보정 · 확대 줄 · 측면 이미지 · 확인 막대 · 감정서 첨부 · 오른쪽 정밀 대조 칸)를
// `showPlus` 하나로 감싸 얹는다(감싼 요소마다 `data-plus`). 시안 `data-role`(그룹등록 · 확인대상 = 감정관 · 관리자)도 showPlus 일 때 따른다.
// r3(편의 — +α 아님): 비교 「1:1 · 1:3 · 1:5」(1:1 = 2차 PairStage 그대로, 1:3 · 1:5 = 현장 1장 대 후보 n장),
// 후보 넘기기(이전 · 다음 · ← → · 수동/자동 — 마지막 후보에서 멈춤, 비교 그림 위 마우스 = 잠시 멈춤). 값은 제어형.

type Look = "rgb" | "sketch"

const LOOK_ITEMS = [
  { value: "rgb", label: "RGB" },
  { value: "sketch", label: "스케치·이진" },
]

// r3 비교 개수(현장 1 : 후보 n) · 자동 넘김 기본 간격
const COMPARE_OPTIONS: readonly CompareCount[] = ["1:1", "1:3", "1:5"]
const DEFAULT_INTERVAL_MS = 2000

const NO_ALIGNMENT = "정렬(ROI+방향)이 설정되지 않았습니다. 먼저 정렬을 저장해 주세요."
const NOT_READY = "준비 중"
// 판정 · 정렬 저장은 지금 앱에서 사건 조회 권한 묶음(CRIME_SEARCH) 안에 있다
const WRITE_FEATURE: FeatureCode = "CRIME_SEARCH"

// 시안 S06 확대 줄(핀 5): 두 이미지에 함께 적용하는 SCAS 뷰어 버튼
const VIEWER_TOOLS = ["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"]

const ZONE_ROWS: { key: keyof ZonePatterns; label: string }[] = [
  { key: "top", label: "상" },
  { key: "mid", label: "중" },
  { key: "bottom", label: "하" },
  { key: "outline", label: "윤곽" },
]

/** 표 한 칸(라벨 · 값). plus = 지금 데이터에 없는 SCAS 칸(+α 로만 보임) */
type InfoCell = { label: string; value: string; plus?: boolean }

/** REQ-ALIGN-007c 「정렬 설정됨」: polygon · arrow 둘 다 있음 */
function isAlignmentSet(alignment: MatchCompareScreenProps["alignment"]): boolean {
  return alignment != null && alignment.polygon != null && alignment.arrow != null
}

/** 채취 일시 `YYYY-MM-DDTHH:MM:SS` → `YYYY-MM-DD HH:MM` */
function formatPickDt(value: string | null | undefined): string {
  return value ? value.replace("T", " ").slice(0, 16) : ""
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

const TH = "border border-solid border-line-2 bg-strip px-[6px] py-[3px] text-left font-normal whitespace-nowrap text-muted-foreground"
const TD = "border border-solid border-line-2 px-[6px] py-[3px] break-keep [overflow-wrap:anywhere] text-fg-2"

function InfoTable({ caseRows, shoeRows }: { caseRows: InfoCell[]; shoeRows: InfoCell[] }) {
  const length = Math.max(caseRows.length, shoeRows.length)
  return (
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
        {Array.from({ length }, (_, i) => (
          <tr key={i}>
            {[caseRows[i], shoeRows[i]].map((cell, j) => {
              const plusAttr = cell?.plus ? { "data-plus": "" } : {}
              return (
                <React.Fragment key={j}>
                  <th scope="row" {...plusAttr} className={TH}>
                    {cell?.label ?? ""}
                  </th>
                  <td {...plusAttr} className={TD}>
                    {cell ? <span className={cn(/\d{4}/.test(cell.value) && "font-code")}>{cell.value}</span> : null}
                  </td>
                </React.Fragment>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
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
  showPlus = true,
  insight,
  onPlusAction,
  candidates = [],
  onCandidateChange,
  compareCount = "1:1",
  onCompareCountChange,
  autoMode = "manual",
  onAutoModeChange,
  intervalMs = DEFAULT_INTERVAL_MS,
  onIntervalChange,
  playing = false,
  onPlayingChange,
}: MatchCompareScreenProps) {
  const canWrite = isAdmin || features.includes(WRITE_FEATURE)
  const roles = viewerRoles(isAdmin, features)
  const plus = showPlus && insight ? insight : null
  // 시안 data-role="analyst admin": 그룹등록 · 확인대상은 감정관 · 관리자에게만(신규 기능을 끄면 1차 그대로)
  const showDecide = !showPlus || roles.analyst
  const [look, setLook] = React.useState<Look>("rgb")
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const [alignOpen, setAlignOpen] = React.useState(false)
  const [asking, setAsking] = React.useState(true)
  const aligned = isAlignmentSet(alignment)
  const action = (label: string) => onPlusAction?.(label)

  const crimeBoxes = React.useMemo(() => matches.map((m) => m.box), [matches])
  // 신발 쪽은 대응점(sx, sy)에 같은 크기의 박스(지금 응답에는 신발 쪽 박스가 따로 없다)
  const shoeBoxes = React.useMemo(() => matches.map((m) => ({ cx: m.sx, cy: m.sy, size: m.box.size })), [matches])

  // SCAS 라벨 순서. 지금 데이터에 없는 칸(SCAS번호 · 문서번호 · 채취방법 · 화종 · 비고)은 +α 값이 있을 때만 그 자리에 넣는다
  const caseRows: InfoCell[] = [
    { label: "이미지번호", value: caseInfo.aprthngNo ?? "" },
    ...(plus
      ? [
          { label: "SCAS번호", value: plus.caseExtra.scasNo, plus: true },
          { label: "문서번호", value: plus.caseExtra.docNo, plus: true },
        ]
      : []),
    { label: "의뢰관서", value: caseInfo.rqestGrfcNm ?? "" },
    { label: "사건명", value: caseInfo.crimeNm ?? "" },
    { label: "채취일시", value: formatPickDt(caseInfo.pickDt) },
    { label: "채취장소", value: caseInfo.pickPlace ?? "" },
    ...(plus ? [{ label: "채취방법", value: plus.caseExtra.pickMethod, plus: true }] : []),
  ]
  const shoeRows: InfoCell[] = [
    { label: "화류번호", value: shoeInfo.ftwrId },
    { label: "제조사", value: shoeInfo.makrCode ?? "" },
    { label: "상표명", value: shoeInfo.brandCode ?? "" },
    { label: "모델번호", value: shoeInfo.modlNm ?? "" },
    ...(plus ? [{ label: "화종", value: plus.shoeExtra.kind, plus: true }] : []),
    { label: "수집년도", value: shoeInfo.colctYear ?? "" },
    { label: "그룹명", value: shoeInfo.ftwrGroupNm ?? "" },
    ...(plus ? [{ label: "비고", value: plus.shoeExtra.note, plus: true }] : []),
  ]

  // ── r3 후보 넘기기(← → · 이전/다음 · 자동) ──
  const byId = candidates.findIndex((c) => c.ftwrId === shoeInfo.ftwrId && (ranking == null || c.rank === ranking))
  const currentIndex = byId >= 0 ? byId : candidates.findIndex((c) => c.ftwrId === shoeInfo.ftwrId)
  const canStep = status === "ready" && candidates.length > 1 && onCandidateChange !== undefined
  const auto = canStep && autoMode === "auto"
  const [hold, setHold] = React.useState(false)

  const advance = (dir: StepDir) => {
    if (!canStep) return
    const to = currentIndex + dir
    if (to >= 0 && to < candidates.length) {
      onCandidateChange?.(candidates[to])
      return
    }
    // 마지막 후보: 자동 넘김은 멈춘다
    if (dir === 1 && auto && playing) onPlayingChange?.(false)
  }
  const clock = useStepClock({ auto, playing, hold, intervalMs, onStep: advance })

  // ← → 후보 · Space 재생/일시정지 — 글자 입력 중 · 정렬 설정 창이 열렸을 때는 듣지 않는다
  const keyRef = React.useRef<(e: KeyboardEvent) => void>(() => undefined)
  React.useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (!canStep || alignOpen || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const el = e.target instanceof HTMLElement ? e.target : null
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault()
        clock.step(e.key === "ArrowRight" ? 1 : -1)
      } else if (e.key === " " && autoMode === "auto" && !el?.closest("button, a, [role='button']")) {
        e.preventDefault()
        onPlayingChange?.(!playing)
      }
    }
  })
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const multi = compareCount === "1:1" ? null : compareCount === "1:3" ? 3 : 5

  const buttons = (
    <ButtonBar variant="modal-head">
      {/* 이전 · 다음: r3 후보 목록이 있으면 앞 · 뒤 후보로(없으면 SCAS 자리만 지키고 비활성). 그룹등록 · 프린트는 지금 앱에 없는 동작 */}
      {canStep ? (
        <>
          <Button size="sm" disabled={currentIndex <= 0} onClick={() => clock.step(-1)}>
            이전
          </Button>
          <Button size="sm" disabled={currentIndex >= candidates.length - 1} onClick={() => clock.step(1)}>
            다음
          </Button>
        </>
      ) : (
        <>
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
        </>
      )}
      {showDecide ? (
        <span title={NOT_READY} className="inline-flex">
          <Button size="sm" disabled>
            그룹등록
          </Button>
        </span>
      ) : null}
      {showDecide ? (
        <Button size="sm" variant="warn" disabled={!canWrite} onClick={onConfirmTarget}>
          확인대상
        </Button>
      ) : null}
      <span title={NOT_READY} className="inline-flex">
        <Button size="sm" disabled>
          프린트
        </Button>
      </span>
      <Button size="sm" onClick={onClose}>
        닫기
      </Button>
      {showPlus && roles.analyst ? (
        <>
          <span data-plus aria-hidden="true" className="mx-[3px] h-[18px] w-px bg-line-3" />
          <Button data-plus size="sm" variant="ai" onClick={() => action("근거 이미지 감정서에 첨부")}>
            근거 이미지 감정서에 첨부
          </Button>
        </>
      ) : null}
      <span aria-hidden="true" className="mx-[3px] h-[18px] w-px bg-line-3" />
      <Button size="sm" onClick={() => setAlignOpen(true)}>
        정렬 설정
      </Button>
    </ButtonBar>
  )

  const okCount = plus ? plus.pairs.filter((p) => p.ok).length : 0
  const badCount = plus ? plus.pairs.length - okCount : 0

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
      <div className="grid min-w-0 gap-[6px]">
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
        <PairStage
          crimeImage={crimeImage}
          shoeImage={shoeImage}
          look={look}
          crimeBoxes={crimeBoxes}
          shoeBoxes={shoeBoxes}
          activeIndex={activeIndex}
          onActive={setActiveIndex}
          crimeCaption={caseInfo.aprthngNo ?? ""}
          shoeCaption={shoeInfo.ftwrId}
          insight={plus}
        />
        {plus ? (
          <>
            <div data-plus data-pair-legend className="flex flex-wrap items-center gap-x-[12px] gap-y-[4px] text-[11px] text-muted-foreground">
              <AiTag>{`AI 대응점 ${plus.pairs.length}`}</AiTag>
              <span className="inline-flex items-center gap-[5px]">
                <i className="inline-block h-[2px] w-[16px] bg-ai shadow-[0_0_4px_0_var(--t-ai)]" />
                일치 <b className="font-code text-ai">{okCount}</b>
              </span>
              <span className="inline-flex items-center gap-[5px]">
                <i className="inline-block w-[16px] border-t-2 border-dashed border-danger-fg" />
                불일치 <b className="font-code text-danger-fg">{badCount}</b>
              </span>
              <span className="inline-flex items-center gap-[5px]">
                <i className="inline-block w-[16px] border-t border-dashed border-[var(--t-heat-yellow)]" />
                상·중·하 구역 선
              </span>
              <span className="ml-auto text-dim">{`번호 1–${plus.representative} = 대표 대응점(감정관이 옮기거나 지울 수 있음)`}</span>
            </div>
            <div data-plus data-zoom-row className="flex flex-wrap items-center gap-[4px]">
              <span className="text-[11px] text-dim">두 이미지 함께</span>
              <Button size="sm" onClick={() => action("−")}>
                −
              </Button>
              <span className="font-code text-[11.5px]">160</span>
              <Button size="sm" onClick={() => action("＋")}>
                ＋
              </Button>
              <Button size="sm" onClick={() => action("좌")}>
                좌
              </Button>
              <span className="font-code text-[11.5px]">0</span>
              <Button size="sm" onClick={() => action("우")}>
                우
              </Button>
              {VIEWER_TOOLS.map((t) => (
                <Button key={t} size="sm" variant="ghost" onClick={() => action(t)}>
                  {t}
                </Button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    )
  }

  const pairList =
    aligned && status === "ready" ? (
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
    ) : null

  let body: React.ReactNode
  if (status === "loading") {
    body = (
      // 움직임은 시안이 움직이는 자리에만 — 대응 계산 대기는 움직이지 않는 글자만 둔다
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
    const infoColumn = (
      <div className="grid min-w-0 content-start gap-[6px]">
        {plus ? (
          <div data-plus className="grid gap-[6px]">
            <span className="rounded-[4px] bg-strip px-[6px] py-[3px] text-[11.5px] text-muted-foreground">측면 이미지</span>
            <span className="relative block h-[104px] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas">
              <img src={plus.sideImage} alt="측면 이미지" className="block size-full object-contain" />
            </span>
          </div>
        ) : null}
        <InfoTable caseRows={caseRows} shoeRows={shoeRows} />
      </div>
    )
    // 마우스를 비교 그림 위에 올리면 자동 넘김을 잠시 멈춘다
    const holdProps = { onMouseEnter: () => setHold(true), onMouseLeave: () => setHold(false) }
    body = (
      <div className="grid min-w-0 gap-[10px]">
        {multi && candidates.length > 0 ? (
          <>
            <div data-compare-area className="grid min-w-0 gap-[6px]" {...holdProps}>
              <div className="flex items-center gap-[8px]">
                <span className="text-[11.5px] text-dim">{`현장 1장 대 후보 ${multi}장 · 후보 칸을 누르면 지금 후보(1:1 로 정밀 대조)`}</span>
                <Segmented
                  items={LOOK_ITEMS}
                  value={look}
                  onValueChange={(v) => setLook(v as Look)}
                  aria-label="보기 방식"
                  className="ml-auto"
                />
              </div>
              <MultiStage
                count={multi}
                crimeImage={crimeImage}
                crimeCaption={caseInfo.aprthngNo ?? ""}
                look={look}
                candidates={candidates}
                currentIndex={currentIndex}
                onPick={(c) => onCandidateChange?.(c)}
              />
            </div>
            {infoColumn}
          </>
        ) : (
          <>
            <div className="grid min-w-0 grid-cols-[460px_minmax(0,1fr)] gap-[10px]">
              <div data-compare-area className="min-w-0" {...holdProps}>
                {compare}
              </div>
              {infoColumn}
            </div>
            {pairList}
          </>
        )}
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
          <span className="inline-flex flex-wrap items-center gap-[8px]">
            {plus ? (
              <span data-plus className="inline-flex items-center gap-[6px]">
                <Chip>{`처리 구분 ${plus.processType}`}</Chip>
                <span className="text-[12px] text-muted-foreground">{`목적: ${plus.purpose}`}</span>
              </span>
            ) : null}
            <span className="inline-flex gap-[6px] font-code text-[12px] text-muted-foreground">
              <span className="text-fg-2">{`No. ${shoeInfo.ftwrId}`}</span>
              {ranking != null ? <span className="tabular-nums">{`#${ranking}`}</span> : null}
            </span>
          </span>
        }
      >
        <div className="@container p-[12px_14px_14px]">
          <div className={cn("grid min-w-0 gap-[14px]", plus && status === "ready" && "@min-[1120px]:grid-cols-[820px_minmax(0,1fr)]")}>
            <div className="grid min-w-0 content-start gap-[8px]">
              {status === "ready" && (onCompareCountChange || (canStep && onAutoModeChange)) ? (
                // r3 편의 줄: 비교 개수 · 후보 넘기기(수동 · 자동)
                <div data-r3-toolbar className="flex flex-wrap items-center gap-x-[14px] gap-y-[6px]">
                  {onCompareCountChange ? (
                    <ViewCountSwitch<CompareCount>
                      label="비교"
                      options={COMPARE_OPTIONS}
                      value={compareCount}
                      onChange={onCompareCountChange}
                    />
                  ) : null}
                  {canStep && onAutoModeChange ? (
                    <span className="inline-flex flex-wrap items-center gap-[8px]">
                      <span className="text-[12px] text-muted-foreground">후보 넘기기</span>
                      <AutoPlayControl
                        mode={autoMode}
                        onModeChange={onAutoModeChange}
                        intervalMs={intervalMs}
                        onIntervalChange={(ms) => onIntervalChange?.(ms)}
                        playing={playing}
                        onPlayPause={() => onPlayingChange?.(!playing)}
                        position={{ index: Math.max(0, currentIndex), total: candidates.length }}
                        remainingRatio={clock.remainingRatio}
                      />
                      <span className="text-[11px] text-dim">← → 후보 · Space 재생/일시정지</span>
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="flex justify-end">{buttons}</div>
              {showPlus && roles.analyst && asking ? (
                <div
                  data-plus
                  data-confirm-bar
                  className="flex items-center gap-[8px] justify-self-end rounded-[8px] border border-solid border-warn-line bg-warn-bg py-[4px] pr-[6px] pl-[10px] text-[12px] text-fg-2"
                >
                  확인대상에 등록하시겠습니까?
                  <Button size="sm" variant="ok" disabled={!canWrite} onClick={onConfirmTarget}>
                    예
                  </Button>
                  <Button size="sm" onClick={() => setAsking(false)}>
                    아니오
                  </Button>
                </div>
              ) : null}
              {body}
            </div>
            {plus && status === "ready" ? <PrecisionPanel insight={plus} roles={roles} /> : null}
          </div>
        </div>
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

import * as React from "react"
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FlipHorizontal2,
  FolderPlus,
  Info,
  Link2,
  Navigation2,
  Paperclip,
  RotateCcw,
  Rows3,
  Save,
  Search,
  Settings2,
  SquareDashed,
  Undo2,
  X,
} from "lucide-react"

import type { AlignEditControl } from "@/features/crime-align"
import { shouldHandleShortcut } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { DialogShell, InlineError, Segmented, ViewCountSwitch, WorkbenchButton } from "@/shared/ui/kit"
import { PaneHead, StepNum } from "@/shared/ui/panel"
import { DEFAULT_LENS, DEFAULT_VIEW_TUNE, LENS_ZOOMS, stepLens, type LensSettings, type ViewTune } from "@/shared/ui/viewer"

import { viewerRoles } from "../model/roles"
import type { CompareCount, MatchCompareScreenProps, MatchImage, ZoneLines } from "../model/types"
import { linkPoint, type LinkFrame, type RatioPoint } from "../model/zoom-link"
import { AiVerdict } from "./AiVerdict"
import { ComparePane } from "./ComparePane"
import { MultiStage } from "./MultiStage"
import { ZoneCompareStrip } from "./ZoneCompareStrip"
import { ZoneLine, ZoneRail, type ZoneStops } from "./ZoneRail"

// 사건 창 「정밀 대조」 탭(11/17 사용자 「자동 수동이 왜 있어 … 서로의 선택한 문양이랑 그런 것도 같이 비교 … 대비 반전 회전 이진화 그리고
// 확대 찍어서, 중지하고, 거기랑 옆에 신발 어느 부위를 같이 확대 클릭해서 비교 … AI 대조 … 컴팩트하고 딱 일목요연하게 … 대응 목록 빼. 정보도 …
// 발견 이미지에 상세 보기 … 딱 상중하 나뉘어서 서로 선택한 문양 비교」).
//   머리(밝은 바탕) — 칸 이름 · 신발 번호 · 이전/다음 후보 · 비교 1:1 · 1:3 · 1:5(작게)
//   먹색 작업판(`data-theme="dark"`): 도구 막대(확대 찍기 · 확대경 · 연동 · 배율 · 대응 박스 · 구역 선 · 원본/스케치 · 정렬 설정)
//     | 1:1 = 유류 | 상 · 중 · 하 부위 문양 | 발견(칸마다 보기 조정 — 대비 · 반전 · 이진화 · 회전) + 아래 윤곽 한 줄
//       (11/17 사용자 「각각 상 중 하 위치에 각각 좌 우 매칭 및 선택한 문양 보여주게. 1:1 일때만 가능. 1:3, 1:5는 힘들 듯」)
//     | 1:3 · 1:5 = 현장 1장 대 후보 n장 + 상 · 중 · 하 문양 비교 띠
//   판 안 정렬 지정(`alignEdit` — 11/17 사용자 「영역만 여기서 바로 이미지가 뜨고 지정해주면 · 폴리곤 치기 좀 쉽게」 ·
//     「정렬 설정 누르면 저기서 바로 설정할 수 있게」): 정렬이 없거나 「정렬 설정」을 누르면 같은 판의 유류 칸에 정렬 캔버스(slot),
//     발견 칸에 참고 그림, 막대 = 그리기 방식(밑창 틀 · 사각형 · 점 찍기) · 닫기 · 마지막 점 · 다시 그리기 · 방향 다시 · 좌우 반전 | 취소 · 정렬 저장,
//     막대 아래 단계(영역 → 방향 → 저장) + 안내 한 줄. 대화 상자는 `alignEdit` 가 없을 때만(예전 그대로).
//   오른쪽 보조 칸(밝은 바탕 · 왼쪽 가는 선) — AI 대조 한눈에
//   바닥 단추 줄 — 그룹등록 · 감정서 첨부 | 확인대상
// 자동/수동 후보 넘기기 · 대응 목록 · 정보 탭 · 확인 물음 막대는 그리지 않는다(단독 진열 `/dev/s06` 은 그대로). 보기 상태는 저장하지 않는다.

type Look = "rgb" | "sketch"
type Side = "crime" | "shoe"

const LOOK_ITEMS = [
  { value: "rgb", label: "원본" },
  { value: "sketch", label: "스케치" },
]
const DRAW_ITEMS = [
  { value: "template", label: "밑창 틀" },
  { value: "rect", label: "사각형" },
  { value: "scratch", label: "점 찍기" },
]
const COMPARE_OPTIONS: readonly CompareCount[] = ["1:1", "1:3", "1:5"]
const NO_ALIGNMENT = "정렬(ROI + 방향)이 아직 없습니다"
const NOT_READY = "준비 중"
const ALIGN_STEPS = ["영역", "방향", "저장"] as const

/** 작업판 막대(한 단 밝은 판 + 가는 선 — 문양 코드 탭 작업판과 같은 결) */
const BAR = "flex shrink-0 flex-wrap items-center gap-x-[6px] gap-y-[4px] bg-panel px-[10px] py-[5px]"
const SEP = <span aria-hidden="true" className="mx-[2px] h-[16px] w-px bg-line-3" />
/** 작업판 막대 안 분할 단추를 단추 sm 높이로 */
const SEG = "p-[2px] [&_button]:px-[7px] [&_button]:py-[1px] [&_button]:text-[11px]"
const LABEL = "shrink-0 text-[10px] font-semibold text-muted-foreground"
/** 머리 줄 안 분할 단추를 24 높이로 */
const COMPACT_SEGMENTS =
  "[&_[data-part=Segmented]]:p-[2px] [&_[data-part=Segmented]_button]:px-[7px] [&_[data-part=Segmented]_button]:py-[1px] [&_[data-part=Segmented]_button]:text-[11px] [&_[data-part=ViewCountSwitch]>span]:text-[11px]"

/** 구역 눈금이 없을 때 그림을 3등분한 상 · 중 · 하 선(그 그림 좌표계) */
function thirdsOf(image: MatchImage): ZoneLines {
  return { x: [0, image.width], top: 0, bounds: [image.height / 3, (image.height * 2) / 3], bottom: image.height }
}

/** 구역 선 → 그림 높이 비율 눈금 */
function stopsOf(zones: ZoneLines, height: number): ZoneStops {
  const h = height > 0 ? height : 1
  return [zones.top / h, zones.bounds[0] / h, zones.bounds[1] / h, zones.bottom / h]
}

/** 판 안 정렬 지정 안내 한 줄 */
function alignGuide(edit: AlignEditControl): string {
  if (edit.flip) return "좌우 반전 미리보기 중 — 영역 · 방향을 고치려면 반전을 끄세요"
  if (edit.phase === "polygon") {
    if (edit.drawMode === "scratch") {
      if (edit.pointCount === 0) return "현장 그림을 눌러 영역의 첫 점을 찍으세요 — 점은 끌어 옮길 수 있습니다"
      if (edit.pointCount < 3) return `점 ${edit.pointCount}개 — 3개 이상 찍으세요 · Backspace 마지막 점 지우기`
      return `점 ${edit.pointCount}개 — 첫 점(초록 고리)을 누르거나 두 번 누름 · Enter 로 영역을 닫으세요 · Backspace 마지막 점`
    }
    if (edit.drawMode === "rect" && edit.pointCount === 0) return "현장 그림 위를 끌어 네모 영역을 그리세요"
    return "틀 안쪽을 끌어 옮기고 점을 끌어 모양을 맞추세요 — 다 되면 앞굽(발끝)을 누르세요"
  }
  if (edit.phase === "arrow") {
    return edit.arrowStep === "heel" ? "방향 — 이제 뒤꿈치를 누르세요" : "방향 — 앞굽(발끝)을 누르세요"
  }
  return "영역 · 방향이 정해졌습니다 — 점 · 틀은 끌어 고칠 수 있고, 다 되면 「정렬 저장」"
}

export function CompareWindow(props: MatchCompareScreenProps) {
  const {
    status,
    isAdmin,
    features,
    ranking,
    alignment,
    matches,
    crimeImage,
    shoeImage,
    caseInfo,
    shoeInfo,
    showPlus = true,
    insight,
    candidates = [],
    onCandidateChange,
    compareCount = "1:1",
    alignEdit: edit,
  } = props
  const canWrite = isAdmin || features.includes("CRIME_SEARCH")
  const roles = viewerRoles(isAdmin, features)
  const plus = showPlus && insight ? insight : null
  const showDecide = !showPlus || roles.analyst
  const aligned = !!alignment && alignment.polygon != null && alignment.arrow != null
  const action = (label: string) => props.onPlusAction?.(label)

  const [look, setLook] = React.useState<Look>("rgb")
  const [tunes, setTunes] = React.useState<Record<Side, ViewTune>>({ crime: DEFAULT_VIEW_TUNE, shoe: DEFAULT_VIEW_TUNE })
  const [lens, setLens] = React.useState<LensSettings>({ ...DEFAULT_LENS, zoom: 3 })
  const [linked, setLinked] = React.useState(true)
  const [pinMode, setPinMode] = React.useState(false)
  const [pin, setPin] = React.useState<{ side: Side; at: RatioPoint } | null>(null)
  const [hover, setHover] = React.useState<{ side: Side; at: RatioPoint } | null>(null)
  const [showBoxes, setShowBoxes] = React.useState(true)
  const [showZones, setShowZones] = React.useState(true)
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const [shoeOpen, setShoeOpen] = React.useState(false)
  // 「신발 상세」 팝: Esc 로 이것만 닫는다(사건 창은 data-esc-layer 를 보고 그대로 둔다)
  React.useEffect(() => {
    if (!shoeOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShoeOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shoeOpen])
  const [alignOpen, setAlignOpen] = React.useState(false)
  // 「정렬 설정」으로 연 판 안 고치기(정렬이 이미 있을 때). 저장 · 취소로 닫는다 — 정렬이 없으면 늘 판 안 지정
  const [manualEdit, setManualEdit] = React.useState(false)

  const multi = compareCount === "1:1" ? null : compareCount === "1:3" ? 3 : 5
  const ready = status === "ready"
  // 판 안 정렬 지정: 1:1 · 준비됨 · 막대 묶음이 있을 때 — 정렬이 없거나 「정렬 설정」을 눌렀을 때
  const editing = ready && !multi && !!edit && (!aligned || manualEdit)
  const openAlign = () => {
    if (!edit) {
      setAlignOpen(true)
      return
    }
    // 판 안 지정은 1:1 판에서 — 1:3 · 1:5 면 1:1 로 돌린다
    if (multi) props.onCompareCountChange?.("1:1")
    setManualEdit(true)
  }
  const cancelEdit = () => {
    edit?.onCancel()
    setManualEdit(false)
  }
  const saveEdit = () => {
    props.onSaveAlignment()
    // 이미 있던 정렬을 고친 것이면 바로 대조 판으로(새 값은 다시 읽어 그린다). 처음 지정이면 정렬이 생길 때까지 그대로
    if (aligned) setManualEdit(false)
  }

  const crimeBoxes = React.useMemo(() => matches.map((m) => m.box), [matches])
  const shoeBoxes = React.useMemo(() => matches.map((m) => ({ cx: m.sx, cy: m.sy, size: m.box.size })), [matches])
  // 상 · 중 · 하 구역: +α 눈금이 있으면 그것, 없으면 그림 3등분(1:1 부위 문양 줄 · 구역 선 · 함께 확대가 같이 쓴다)
  const crimeZones = plus?.zoneLines.crime ?? thirdsOf(crimeImage)
  const shoeZones = plus?.zoneLines.shoe ?? thirdsOf(shoeImage)
  const frames: Record<Side, LinkFrame> = {
    crime: { width: crimeImage.width, height: crimeImage.height, zones: crimeZones },
    shoe: { width: shoeImage.width, height: shoeImage.height, zones: shoeZones },
  }
  /** 이 칸의 핀 — 찍은 칸은 그 자리, 연동이면 반대 칸은 같은 상 · 중 · 하 위치 비율 자리 */
  const pinOf = (side: Side): RatioPoint | null => {
    if (!pin) return null
    if (pin.side === side) return pin.at
    return linked ? linkPoint(pin.at, frames[pin.side], frames[side]) : null
  }
  /** 반대 칸 마우스 자리의 짝(연동일 때) */
  const partnerOf = (side: Side): RatioPoint | null =>
    linked && hover && hover.side !== side ? linkPoint(hover.at, frames[hover.side], frames[side]) : null

  // ── 후보 이전 · 다음(← →) ──
  const byId = candidates.findIndex((c) => c.ftwrId === shoeInfo.ftwrId && (ranking == null || c.rank === ranking))
  const currentIndex = byId >= 0 ? byId : candidates.findIndex((c) => c.ftwrId === shoeInfo.ftwrId)
  const canStep = status === "ready" && candidates.length > 1 && onCandidateChange !== undefined
  const step = (dir: 1 | -1) => {
    const to = currentIndex + dir
    if (canStep && to >= 0 && to < candidates.length) onCandidateChange?.(candidates[to])
  }
  const keyRef = React.useRef<(e: KeyboardEvent) => void>(() => undefined)
  React.useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      // Esc 는 창 닫기 몫이라 듣지 않는다(핀은 다시 누르면 풀림). 정렬을 그리는 동안은 후보를 넘기지 않는다(그리던 것이 날아감)
      if (alignOpen || editing || !shouldHandleShortcut(e)) return
      if (canStep && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault()
        step(e.key === "ArrowRight" ? 1 : -1)
      }
    }
  })
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const lensStep = (by: 1 | -1) => setLens((l) => ({ ...l, size: stepLens(l.size, by) }))
  const togglePinMode = () => {
    setPinMode((v) => !v)
    setPin(null)
  }

  const shoeRows: [string, string][] = [
    ["화류번호", shoeInfo.ftwrId],
    ["제조사", shoeInfo.makrCode ?? ""],
    ["상표명", shoeInfo.brandCode ?? ""],
    ["모델번호", shoeInfo.modlNm ?? ""],
    ...(plus ? ([["화종", plus.shoeExtra.kind]] as [string, string][]) : []),
    ["수집년도", shoeInfo.colctYear ?? ""],
    ["그룹명", shoeInfo.ftwrGroupNm ?? ""],
  ]
  const shoeDetail = shoeOpen ? (
    <div
      role="dialog"
      data-esc-layer=""
      aria-label="신발 상세"
      className="absolute top-[8px] right-[8px] z-[5] grid w-[236px] gap-[8px] rounded-[10px] border border-solid border-line-3 bg-panel p-[10px] [box-shadow:0_12px_32px_var(--t-panel-drop)]"
    >
      <div className="flex items-center gap-[6px]">
        <b className="text-[12.5px] text-foreground">신발 상세</b>
        <span className="font-code text-[11px] text-muted-foreground">{shoeInfo.ftwrId}</span>
        <WorkbenchButton size="sm" variant="ghost" icon={X} iconOnly aria-label="신발 상세 닫기" className="ml-auto" onClick={() => setShoeOpen(false)} />
      </div>
      {plus ? (
        <span className="relative block h-[72px] overflow-hidden rounded-[6px] border border-solid border-border bg-canvas">
          <img src={plus.sideImage} alt="측면 이미지" className="block size-full object-contain" />
        </span>
      ) : null}
      <dl className="m-0 grid grid-cols-[64px_minmax(0,1fr)] gap-x-[8px] gap-y-[3px] text-[11px]">
        {shoeRows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="m-0 truncate text-fg-2">{v || "—"}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  ) : null

  const pane = (side: Side) => {
    const crime = side === "crime"
    return (
      <ComparePane
        side={side}
        title={crime ? "유류 이미지" : "발견 이미지"}
        code={crime ? (caseInfo.aprthngNo ?? "") : `${shoeInfo.ftwrId}${ranking != null ? ` · #${ranking}` : ""}`}
        image={crime ? crimeImage : shoeImage}
        look={look}
        tune={tunes[side]}
        onTuneChange={(t) => setTunes((v) => ({ ...v, [side]: t }))}
        lens={lens}
        onLensSizeStep={lensStep}
        zones={showZones ? frames[side].zones : undefined}
        boxes={crime ? crimeBoxes : shoeBoxes}
        showBoxes={showBoxes}
        activeIndex={activeIndex}
        onActive={setActiveIndex}
        pinMode={pinMode}
        pin={pinOf(side)}
        partner={partnerOf(side)}
        onHover={(at) => setHover(at ? { side, at } : null)}
        onPick={(at) => setPin((p) => (p ? null : { side, at }))}
        headEnd={
          crime ? null : (
            <WorkbenchButton
              size="sm"
              variant="ghost"
              icon={Info}
              iconOnly
              aria-pressed={shoeOpen}
              aria-label="신발 상세 보기"
              title="신발 상세 보기"
              onClick={() => setShoeOpen((v) => !v)}
            />
          )
        }
      >
        {crime ? null : shoeDetail}
      </ComparePane>
    )
  }

  /** 판 안 정렬 지정 칸 — 유류 = 정렬 캔버스(slot), 발견 = 참고 그림(원본 · 스케치) */
  const editStage = (
    <div data-align-board className="grid h-full min-h-0 grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-label="유류 이미지 — 영역 지정" className="flex min-h-0 min-w-0 flex-col border-0 border-r border-solid border-border">
        <div className={cn(BAR, "border-0 border-b border-solid border-border py-[4px]")}>
          <h3 className="m-0 text-[12.5px] font-bold whitespace-nowrap text-foreground">유류</h3>
          <span className="min-w-0 truncate font-code text-[11px] text-muted-foreground">{caseInfo.aprthngNo ?? ""}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">저장 원본 위에 영역 · 방향</span>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden bg-canvas p-[12px]">{props.alignmentSlot}</div>
      </section>
      <section aria-label="발견 이미지 — 참고" className="flex min-h-0 min-w-0 flex-col">
        <div className={cn(BAR, "border-0 border-b border-solid border-border py-[4px]")}>
          <h3 className="m-0 text-[12.5px] font-bold whitespace-nowrap text-foreground">발견</h3>
          <span className="min-w-0 truncate font-code text-[11px] text-muted-foreground">{`${shoeInfo.ftwrId}${ranking != null ? ` · #${ranking}` : ""}`}</span>
          <Segmented items={LOOK_ITEMS} value={look} onValueChange={(v) => setLook(v as Look)} aria-label="보기 방식" className={cn(SEG, "ml-auto")} />
        </div>
        <div className="grid min-h-0 flex-1 place-items-center bg-canvas p-[12px]">
          <img
            src={look === "rgb" ? shoeImage.rgb : shoeImage.sketch}
            alt={`발견 이미지 ${shoeInfo.ftwrId}`}
            draggable={false}
            className="block max-h-full max-w-full object-contain select-none"
          />
        </div>
      </section>
    </div>
  )

  let stage: React.ReactNode
  if (status === "loading") {
    stage = (
      <div aria-busy="true" role="status" className="grid h-full place-content-center text-[12.5px] text-muted-foreground">
        대응점 계산 중
      </div>
    )
  } else if (status === "error") {
    stage = (
      <div className="grid h-full place-content-center">
        <InlineError message="대응 매칭을 확인 못 함" at={props.errorAt} onRetry={props.onRetry} />
      </div>
    )
  } else if (multi && candidates.length > 0) {
    stage = (
      <div className="h-full overflow-y-auto bg-canvas p-[10px]">
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
    )
  } else if (editing) {
    stage = editStage
  } else if (!aligned) {
    stage = (
      <div className="grid h-full place-content-center justify-items-center gap-[10px] bg-canvas text-center">
        <span className="text-[12.5px] text-fg-2">{NO_ALIGNMENT}</span>
        <WorkbenchButton variant="primary" icon={Settings2} onClick={() => setAlignOpen(true)}>
          정렬 설정
        </WorkbenchButton>
      </div>
    )
  } else {
    // 1:1 — 유류 | 상 · 중 · 하 부위 문양 | 발견(줄 높이는 두 그림의 그 부위 높이)
    stage = (
      <div
        data-zone-stage
        className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_156px_minmax(0,1fr)] @max-[920px]:grid-cols-[minmax(0,1fr)_132px_minmax(0,1fr)]"
      >
        <div className="flex min-h-0 min-w-0 flex-col border-0 border-r border-solid border-border">{pane("crime")}</div>
        <ZoneRail
          crime={props.crimePatterns}
          shoe={props.shoePatterns}
          crimeStops={stopsOf(crimeZones, crimeImage.height)}
          shoeStops={stopsOf(shoeZones, shoeImage.height)}
          basis={plus?.basis}
          className="border-0 border-r border-solid border-border"
        />
        <div className="flex min-h-0 min-w-0 flex-col">{pane("shoe")}</div>
      </div>
    )
  }

  const sideBySide = ready && aligned && !multi && !editing
  const tool = (label: string, pressed: boolean, onClick: () => void, icon: typeof Search, title: string, disabled = false) => (
    <WorkbenchButton size="sm" variant="ghost" icon={icon} aria-pressed={pressed} title={title} disabled={disabled} onClick={onClick}>
      {label}
    </WorkbenchButton>
  )

  // 판 안 정렬 지정 막대 · 단계 · 안내
  const stepAt = edit ? (edit.phase === "polygon" ? 0 : edit.phase === "arrow" ? 1 : 2) : 0
  const editBar = edit ? (
    <>
      <div role="toolbar" aria-label="정렬 도구" className={cn(BAR, "border-0 border-b border-solid border-border")}>
        <span className={LABEL}>영역</span>
        <Segmented
          items={DRAW_ITEMS}
          value={edit.drawMode}
          onValueChange={(v) => {
            if (v !== edit.drawMode) edit.onDrawMode(v as AlignEditControl["drawMode"])
          }}
          aria-label="영역 그리기 방식"
          className={SEG}
        />
        {edit.drawMode === "scratch" && edit.phase === "polygon" ? (
          <>
            <WorkbenchButton size="sm" variant="soft" icon={Check} disabled={!edit.canClose || edit.flip} onClick={edit.onClose} title="첫 점을 누르거나 두 번 누름 · Enter">
              영역 닫기
            </WorkbenchButton>
            <WorkbenchButton size="sm" variant="ghost" icon={Undo2} disabled={edit.pointCount === 0 || edit.flip} onClick={edit.onUndo} title="마지막 점 지우기 (Backspace)">
              마지막 점
            </WorkbenchButton>
          </>
        ) : null}
        {SEP}
        <WorkbenchButton size="sm" variant="ghost" icon={RotateCcw} onClick={edit.onRestart} title="지금 방식으로 영역 · 방향을 처음부터">
          다시 그리기
        </WorkbenchButton>
        {edit.arrowStep !== "toe" ? (
          <WorkbenchButton size="sm" variant="ghost" icon={Navigation2} onClick={edit.onRedoArrow} title="앞굽 · 뒤꿈치를 다시 누르기">
            방향 다시
          </WorkbenchButton>
        ) : null}
        <WorkbenchButton size="sm" variant="ghost" icon={FlipHorizontal2} aria-pressed={edit.flip} onClick={edit.onFlip} title="족적이 밑창과 좌우가 반대일 때(저장 값에 반전 여부만)">
          좌우 반전
        </WorkbenchButton>
        <span className="ml-auto inline-flex items-center gap-[6px]">
          {aligned ? (
            <WorkbenchButton size="sm" variant="ghost" icon={X} onClick={cancelEdit} title="고친 것을 버리고 저장된 정렬로">
              취소
            </WorkbenchButton>
          ) : null}
          <WorkbenchButton
            size="sm"
            variant="primary"
            icon={Save}
            disabled={!canWrite || !edit.canSave || edit.saving}
            title={canWrite ? undefined : "정렬 저장 권한이 없습니다"}
            onClick={saveEdit}
          >
            {edit.saving ? "저장 중…" : "정렬 저장"}
          </WorkbenchButton>
        </span>
      </div>
      <div data-align-guide className="flex shrink-0 flex-wrap items-center gap-x-[12px] gap-y-[3px] border-0 border-b border-solid border-border bg-panel px-[10px] py-[4px] text-[11px]">
        <ol aria-label="정렬 단계" className="m-0 flex list-none items-center gap-[8px] p-0">
          {ALIGN_STEPS.map((label, i) => (
            <li key={label} aria-current={i === stepAt ? "step" : undefined} className="inline-flex items-center gap-[4px]">
              <StepNum state={i < stepAt ? "done" : "pending"} n={i + 1} size={16} now={i === stepAt} />
              <span className={i === stepAt ? "font-bold text-foreground" : "text-muted-foreground"}>{label}</span>
            </li>
          ))}
        </ol>
        <span role="status" className="min-w-0 text-fg-2">
          {alignGuide(edit)}
        </span>
      </div>
    </>
  ) : null

  return (
    <>
      <section aria-label="정밀 대조" data-slot="match-compare-window" className="@container flex h-full min-h-0 min-w-0 flex-col gap-[8px] p-[12px]">
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_256px] @max-[920px]:grid-cols-[minmax(0,1fr)_224px]">
          <section aria-label="유류 · 발견 대조" className="flex min-h-0 min-w-0 flex-col gap-[8px] pr-[14px] @max-[920px]:pr-[10px]">
            <PaneHead
              title="유류 · 발견 대조"
              sub={<span className="font-code">{`No. ${shoeInfo.ftwrId}${ranking != null ? ` · #${ranking}` : ""}`}</span>}
              tip="확대 찍기: 한쪽을 누르면 그 자리와 반대쪽 같은 상 · 중 · 하 위치를 함께 키워 멈춥니다(다시 누르면 풀림). 확대경 지름은 Shift + 휠 또는 [ ] 키, ← → 후보. 1:1 은 두 그림 사이에 상 · 중 · 하 부위별 현장 · 신발 문양(같은 이름 = 일치)."
              end={
                ready ? (
                  <span className={cn("inline-flex items-center gap-[6px] pb-[3px]", COMPACT_SEGMENTS)}>
                    {canStep ? (
                      <span role="group" aria-label="후보" className="inline-flex items-center gap-[2px]">
                        <WorkbenchButton size="sm" variant="ghost" icon={ChevronLeft} iconOnly aria-label="이전" disabled={currentIndex <= 0 || editing} onClick={() => step(-1)} />
                        <span className="font-code text-[11px] text-muted-foreground tabular-nums">{`${currentIndex + 1}/${candidates.length}`}</span>
                        <WorkbenchButton
                          size="sm"
                          variant="ghost"
                          icon={ChevronRight}
                          iconOnly
                          aria-label="다음"
                          disabled={currentIndex >= candidates.length - 1 || editing}
                          onClick={() => step(1)}
                        />
                      </span>
                    ) : null}
                    {props.onCompareCountChange ? (
                      <ViewCountSwitch<CompareCount> label="비교" options={COMPARE_OPTIONS} value={compareCount} onChange={props.onCompareCountChange} />
                    ) : null}
                  </span>
                ) : null
              }
            />
            <div
              data-theme="dark"
              data-slot="compare-workbench"
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-solid border-border bg-panel text-foreground [box-shadow:0_6px_18px_var(--t-panel-drop)]"
            >
              {ready && editing ? editBar : null}
              {ready && !editing ? (
                <div role="toolbar" aria-label="대조 도구" className={cn(BAR, "border-0 border-b border-solid border-border")}>
                  {sideBySide ? (
                    <>
                      {tool("확대 찍기", pinMode, togglePinMode, Crosshair, "한쪽을 누르면 두 그림을 함께 키워 멈춤 — 다시 누르면 풀림")}
                      {tool("확대경", lens.on, () => setLens((l) => ({ ...l, on: !l.on })), Search, "마우스를 댄 자리를 동그랗게 — 지름은 Shift + 휠 또는 [ ] 키")}
                      {tool("연동", linked, () => setLinked((v) => !v), Link2, "반대쪽 같은 상 · 중 · 하 위치를 함께 표시 · 함께 확대")}
                      <span role="group" aria-label="배율" className="inline-flex items-center gap-[1px]">
                        {LENS_ZOOMS.map((z) => (
                          <WorkbenchButton
                            key={z}
                            size="sm"
                            variant="ghost"
                            aria-pressed={lens.zoom === z}
                            aria-label={`${z}배`}
                            className="px-[6px] font-code"
                            onClick={() => setLens((l) => ({ ...l, zoom: z }))}
                          >
                            ×{z}
                          </WorkbenchButton>
                        ))}
                      </span>
                      {SEP}
                      {tool("대응 박스", showBoxes, () => setShowBoxes((v) => !v), SquareDashed, `Top-${matches.length} 대응 박스 — 번호가 같은 박스끼리 짝`)}
                      {tool("구역 선", showZones, () => setShowZones((v) => !v), Rows3, plus ? "상 · 중 · 하 구역 선" : "상 · 중 · 하 구역 선(그림 3등분 — 가운데 부위 문양 줄과 같은 높이)")}
                      {SEP}
                    </>
                  ) : null}
                  <Segmented
                    items={LOOK_ITEMS}
                    value={look}
                    onValueChange={(v) => setLook(v as Look)}
                    aria-label="보기 방식"
                    className="p-[2px] [&_button]:px-[7px] [&_button]:py-[1px] [&_button]:text-[11px]"
                  />
                  <WorkbenchButton size="sm" variant="ghost" icon={Settings2} className="ml-auto" onClick={openAlign}>
                    정렬 설정
                  </WorkbenchButton>
                </div>
              ) : null}
              <div data-compare-area data-align-editing={editing ? "true" : undefined} className="min-h-0 flex-1">
                {stage}
              </div>
              {ready && multi ? (
                <div className="shrink-0 border-0 border-t border-solid border-border bg-panel">
                  <ZoneCompareStrip crime={props.crimePatterns} shoe={props.shoePatterns} basis={plus?.basis} />
                </div>
              ) : null}
              {sideBySide ? (
                <div className="shrink-0 border-0 border-t border-solid border-border bg-panel">
                  <ZoneLine crime={props.crimePatterns} shoe={props.shoePatterns} />
                </div>
              ) : null}
            </div>
          </section>

          <aside aria-label="AI 대조 칸" className="flex min-h-0 min-w-0 flex-col gap-[12px] overflow-y-auto border-0 border-l border-solid border-border pl-[14px] @max-[920px]:pl-[10px]">
            <PaneHead title="AI 대조" />
            {plus && ready ? (
              <AiVerdict insight={plus} />
            ) : props.verdict && ready ? (
              <AiVerdict insight={props.verdict} plus={false} />
            ) : (
              <p className="m-0 text-[11px] text-muted-foreground">{ready ? "AI 대조 값이 없습니다" : "—"}</p>
            )}
          </aside>
        </div>

        {/* 바닥 단추 줄: 그룹등록 · 감정서 첨부 | 확인대상(닫기는 창 ✕) */}
        <div className="flex shrink-0 flex-wrap items-center gap-[8px] border-0 border-t border-solid border-border pt-[8px]">
          {showDecide ? (
            <span title={NOT_READY} className="inline-flex">
              <WorkbenchButton variant="ghost" icon={FolderPlus} disabled>
                그룹등록
              </WorkbenchButton>
            </span>
          ) : null}
          {showPlus && roles.analyst ? (
            <WorkbenchButton data-plus variant="soft" icon={Paperclip} onClick={() => action("근거 이미지 감정서에 첨부")}>
              감정서 첨부
            </WorkbenchButton>
          ) : null}
          {/* 확인대상 저장(E3)은 판정 확정 권한(EXAM_DECIDE — 서버와 같음, [검수]) */}
          {showDecide ? (
            <WorkbenchButton variant="primary" icon={BadgeCheck} disabled={!roles.analyst} onClick={props.onConfirmTarget} className="ml-auto">
              확인대상
            </WorkbenchButton>
          ) : null}
        </div>
      </section>

      {/* 판 안 정렬 지정 묶음(alignEdit)이 없을 때만 — 예전 대화 상자 */}
      {edit ? null : (
        <DialogShell
          open={alignOpen}
          onOpenChange={setAlignOpen}
          title="정렬 설정"
          size="large"
          actions={
            <WorkbenchButton
              variant="primary"
              icon={Save}
              disabled={!canWrite}
              onClick={() => {
                props.onSaveAlignment()
                setAlignOpen(false)
              }}
            >
              정렬 저장
            </WorkbenchButton>
          }
        >
          <div className="grid gap-[8px] p-[12px_14px_14px]">
            <span className="text-[12.5px] text-muted-foreground">관심영역(ROI)을 다각형으로 두르고 앞코 방향 화살표를 그린 뒤 저장합니다.</span>
            <div className="relative h-[460px] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas">{props.alignmentSlot}</div>
          </div>
        </DialogShell>
      )}
    </>
  )
}

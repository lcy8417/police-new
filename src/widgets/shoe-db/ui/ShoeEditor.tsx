import * as React from "react"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ImagePlus, RotateCw, Save, Sparkles } from "lucide-react"

import {
  insertPatternPath,
  PATTERN_ZONES,
  PatternLibrary,
  PatternPeek,
  PatternZoneBoard,
  stripPatternPath,
  type PatternLibraryItem,
  type PatternZone,
  type PatternZoneCards,
} from "@/entities/pattern"
import type { Shoe } from "@/entities/shoe"
import { hasLayerAbove } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { AiTag, ScanOverlay } from "@/shared/ui/ai"
import { Field, Segmented, WorkbenchButton } from "@/shared/ui/kit"
import {
  DEFAULT_LENS,
  DEFAULT_VIEW_TUNE,
  LensBox,
  ViewControls,
  stepLens,
  viewTuneClass,
  viewTuneLabels,
  type LensSettings,
  type LensSpot,
  type ViewTune,
} from "@/shared/ui/viewer"

import { SHOE_PATTERN_DESC } from "../model/palette"
import type { ShoeAiDetail, ShoeDialogState, ShoeExtractState, ShoeWorkStatus } from "../model/types"

type SoleLook = "original" | "shoerinsics"

const TEXT_FIELDS: { key: "modlNm" | "brandCode" | "makrCode" | "colctPlace" | "colctYear"; label: string; width: string }[] = [
  { key: "modlNm", label: "모델명", width: "w-[180px]" },
  { key: "brandCode", label: "상표코드", width: "w-[96px]" },
  { key: "makrCode", label: "제조사코드", width: "w-[96px]" },
  { key: "colctPlace", label: "수집처", width: "w-[120px]" },
  { key: "colctYear", label: "수집연도", width: "w-[72px]" },
]

const LOW = 0.7
/** 작업판 막대(문양 코드 탭 작업판과 같은 결) */
const BAR = "flex shrink-0 flex-wrap items-center gap-x-[8px] gap-y-[4px] bg-panel px-[10px] py-[5px]"
/** 그림 위 꼬리표 */
const TAG = "pointer-events-none absolute rounded-[5px] bg-canvas/90 px-[7px] py-[2px] font-code text-[10px] text-fg-2"
/** Shoerinsics 이진화 그림 근사(진열 — 운영은 서버 `/shoes_images/Shoerinsics/<ftwrId>.png`) */
const SHOERINSICS = "grayscale contrast-[8]"
const SMALL_SEG = "p-[2px] [&_button]:px-[7px] [&_button]:py-[1px] [&_button]:text-[11px]"
/** 기본정보 입력 칸(라벨 위 · 칸 아래 — 한 줄에 여섯 칸) */
const INFO_LABEL = "grid gap-[2px] text-[10px] font-semibold text-muted-foreground"
const patternSrc = (name: string) => String(insertPatternPath(name))
const nameOf = (src: string) => {
  const s = stripPatternPath(src)
  return typeof s === "string" ? s : s[0]
}

/** 상 · 중 · 하 경계선(가짜 캔버스 장식 — 문양 코드 탭과 같은 모양). 좌표를 재지 않는 pointer-events-none 장식 */
function SoleZoneLines() {
  return (
    <div data-deco="sole-zone-lines" aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute inset-x-0 top-[34%] h-0 border-t-2 border-dashed border-danger" />
      <span className="absolute inset-x-0 top-[67%] h-0 border-t-2 border-dashed border-danger" />
      <span className={cn(TAG, "top-[14%] left-[6px]")}>상</span>
      <span className={cn(TAG, "top-[47%] left-[6px]")}>중</span>
      <span className={cn(TAG, "top-[80%] left-[6px]")}>하</span>
    </div>
  )
}

export interface ShoeEditorProps {
  dialog: ShoeDialogState
  /** 기본정보 · 그림 · (분업 prop 이 없으면) 문양까지 고칠 수 있나 — 등록 담당(`SHOE_EDIT`) */
  canEdit: boolean
  /** (분업) 문양 입력 담당 — 없으면 canEdit 를 따른다. 승인된 신발(form.approved)이면 문양은 잠긴다 */
  canPattern?: boolean
  /** (분업) 승인 담당 — 없으면 예전처럼 관리자만(승인 단추는 canEdit 일 때만 보임) */
  canApprove?: boolean
  isAdmin: boolean
  detail?: ShoeAiDetail
  workStatus?: ShoeWorkStatus
  /** 종류별 전체 문양 이름 */
  library: Record<string, readonly string[]>
  extractState: ShoeExtractState
  onExtract: () => void
  /** AI 가 넣은 제안을 모두 확인(점선 제안 → 확인된 AI 문양) */
  onConfirmAi: () => void
  /** AI 제안 한 장 확인 */
  onConfirmAiOne?: (zone: PatternZone, name: string) => void
  onPrev?: () => void
  onNext?: () => void
  onApprove: () => void
  onFormChange: (form: Shoe) => void
  onSave: () => void
  onClose: () => void
  onReplaceImage: () => void
  onRotateImage: () => void
  onPlusAction?: (action: string) => void
}

/**
 * 신발 등록 · 편집 판 — 한 화면(11/17 사용자 「기본정보 · 문양정보 이건 묶는게 나을 거 같은데?? 하나로 등록하잖아」 ·
 * 「기존 컴포넌트들 활용한 거 맞아?? … 컴팩트 하지 않는데?? 문양 목록도 너무 안보이네」).
 *   위 한 줄: ← 목록 · 신발ID · 모델명 · 작업 상태 ……… ‹ › · 승인 · 저장
 *   기본정보 한 줄: 신발ID · 모델명 · 상표코드 · 제조사코드 · 수집처 · 수집연도(컴팩트 입력)
 *   먹색 작업판: 왼쪽 밑창(원본 / Shoerinsics · 이미지 등록 · 회전 · 보기 조정 · 확대경 · 상중하 경계선 · AI 문양 추출) | 가운데 4부위 문양
 *   오른쪽 밝은 칸: 확대 보기 칸 + 문양 목록(문양 코드 탭과 같은 공용 부품 — entities/pattern)
 * 신발 문양은 이름 문자열 배열이다(docs/pattern-data-model.md §2). 넣기 · 빼기 · 중복 판정도 이름 기준.
 */
export function ShoeEditor(props: ShoeEditorProps) {
  const { dialog, canEdit, isAdmin, detail, workStatus, library, extractState } = props
  const { form, mode, saveError } = dialog
  const isNew = mode === "new"
  // 승인된 신발은 문양 잠김(서버 J5 · J6 409 — 설계서 §3-8). 분업 prop 이 없으면 예전처럼 canEdit 하나로
  const approved = form.approved === true
  const canPatternEdit = (props.canPattern ?? canEdit) && !approved
  const showApprove = props.canApprove ?? canEdit
  const showSave = canEdit || canPatternEdit
  const [zone, setZone] = React.useState<PatternZone>("top")
  const kinds = Object.keys(library)
  const [kind, setKind] = React.useState(kinds[0] ?? "")
  const [look, setLook] = React.useState<SoleLook>("original")
  const [tune, setTune] = React.useState<ViewTune>(DEFAULT_VIEW_TUNE)
  const [lens, setLens] = React.useState<LensSettings>(DEFAULT_LENS)
  const [spot, setSpot] = React.useState<LensSpot | null>(null)
  // 밑창 그림을 누르면 그 자리에 확대경 고정(다시 누름 · Esc 로 풀기 — 문양 코드 탭과 같음, 11/17 사용자 「클릭하면 고정이 되어야지」)
  const [pin, setPin] = React.useState<LensSpot | null>(null)
  const changeLens = (next: LensSettings) => {
    setLens(next)
    if (!next.on) setPin(null)
  }
  const [hovered, setHovered] = React.useState<PatternLibraryItem | null>(null)
  // AI 출처는 부위 · 이름별(다른 부위에 손으로 넣은 같은 이름은 수동 그대로 — 2회차 검수)
  const aiMarks = dialog.aiMarks
  const suggestedCount = PATTERN_ZONES.reduce((n, z) => n + form[z.zone].filter((name) => aiMarks?.[z.zone]?.[name] === "suggested").length, 0)
  const extracting = extractState === "running"

  // Esc = 편집 판만 닫고 목록으로(바깥 신발 DB 패널은 data-esc-layer 를 보고 그대로 — 한 층씩, 2회차 검수).
  // 안쪽 층(고르기 목록 · 크게 살펴보기)이 먼저 받은 Esc 는 건드리지 않는다
  const closeRef = React.useRef(props.onClose)
  React.useEffect(() => {
    closeRef.current = props.onClose
  }, [props.onClose])
  // 위에 다른 층(화면 설정 · 관리 ▾ · 고르기 목록)이 열려 있으면 그 층 몫(3회차 검수 — 함께 닫히던 것)
  const rootRef = React.useRef<HTMLElement>(null)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || hasLayerAbove(rootRef.current)) return
      e.preventDefault()
      closeRef.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])
  const cls = viewTuneClass(tune)
  const tuneLabels = viewTuneLabels(tune)
  const zoneLabel = PATTERN_ZONES.find((z) => z.zone === zone)?.label ?? ""
  const total = PATTERN_ZONES.reduce((n, z) => n + form[z.zone].length, 0)

  const setZoneNames = (key: PatternZone, names: string[]) => props.onFormChange({ ...form, [key]: names })
  // 이름 기준으로 넣고 빼기(같은 부위에 같은 이름 두 번 없음)
  const insertTo = (key: PatternZone, name: string) => {
    if (!canPatternEdit || form[key].includes(name)) return
    setZoneNames(key, [...form[key], name])
  }
  const toggle = (item: PatternLibraryItem) => {
    if (!canPatternEdit) return
    const list = form[zone]
    if (list.includes(item.name)) setZoneNames(zone, list.filter((n) => n !== item.name))
    else insertTo(zone, item.name)
  }

  const cards = React.useMemo(() => {
    const out = {} as Record<PatternZone, PatternZoneCards[PatternZone]>
    for (const { zone: z } of PATTERN_ZONES) {
      out[z] = form[z].map((n) => ({ name: n, src: patternSrc(n), status: aiMarks?.[z]?.[n] ?? ("manual" as const) }))
    }
    return out as PatternZoneCards
  }, [form, aiMarks])

  const zoneNote: Partial<Record<PatternZone, React.ReactNode>> = {}
  if (detail) {
    for (const z of ["top", "mid", "bottom"] as const) {
      const c = detail.conf[z]
      zoneNote[z] = (
        <span title={`${PATTERN_ZONES.find((p) => p.zone === z)?.label} AI 확신도`} className={cn("font-code text-[11px] tabular-nums", c < LOW ? "text-warn" : "text-muted-foreground")}>
          {c < LOW ? "확인 " : ""}
          {c.toFixed(2)}
        </span>
      )
    }
  }

  const soleImage = (copy: boolean) =>
    form.image ? (
      <img src={form.image} alt={copy ? "" : `${form.ftwrId} 밑창`} className={cn("size-full object-contain", look === "shoerinsics" && SHOERINSICS)} />
    ) : null

  const head = (
    <div className="flex shrink-0 flex-wrap items-center gap-x-[8px] gap-y-[4px] border-0 border-b border-solid border-border px-[12px] py-[6px]">
      <WorkbenchButton size="sm" variant="ghost" icon={ArrowLeft} onClick={props.onClose}>
        목록
      </WorkbenchButton>
      <h3 className="m-0 font-code text-[13px] font-bold text-foreground">{isNew ? "새 신발" : form.ftwrId}</h3>
      {form.modlNm ? <span className="max-w-[220px] truncate text-[12.5px] text-muted-foreground">{form.modlNm}</span> : null}
      {workStatus ? <span className="rounded-[5px] bg-strip px-[6px] py-px text-[11px] text-fg-2">{workStatus}</span> : null}
      {approved ? (
        <span title="승인된 신발의 문양은 고칠 수 없습니다" className="rounded-[5px] bg-strip px-[6px] py-px text-[11px] text-fg-2">
          승인됨 · 문양 잠김
        </span>
      ) : null}
      {!isNew && form.inSearchIndex === false ? (
        <span className="rounded-[5px] bg-strip px-[6px] py-px text-[11px] text-muted-foreground">검색 후보 아님(배치 반영 전)</span>
      ) : null}
      <span className="ml-auto inline-flex items-center gap-[4px]">
        <WorkbenchButton size="sm" variant="ghost" icon={ChevronLeft} iconOnly aria-label="이전 신발" disabled={!props.onPrev} onClick={props.onPrev} />
        <WorkbenchButton size="sm" variant="ghost" icon={ChevronRight} iconOnly aria-label="다음 신발" disabled={!props.onNext} onClick={props.onNext} />
        {showApprove ? (
          <WorkbenchButton
            size="sm"
            variant="soft"
            icon={Check}
            // 분업 승인 담당: 새 신발 · 이미 승인 · 문양 없음이면 꺼짐(서버 J7 409와 같은 조건). 분업 prop 이 없으면 예전처럼 관리자만
            disabled={props.canApprove !== undefined ? !props.canApprove || isNew || approved || total === 0 : !isAdmin || isNew}
            title={approved ? "이미 승인됨" : total === 0 ? "문양을 입력한 뒤 승인" : "승인 담당만"}
            onClick={props.onApprove}
          >
            승인
          </WorkbenchButton>
        ) : null}
        {showSave ? (
          <WorkbenchButton size="sm" variant="primary" icon={Save} onClick={props.onSave}>
            저장
          </WorkbenchButton>
        ) : null}
      </span>
    </div>
  )

  // 기본정보 — 위쪽 한 줄 컴팩트 입력(따로 탭 없음)
  const info = (
    <section aria-label="기본정보" className="flex shrink-0 flex-wrap items-end gap-x-[10px] gap-y-[6px] px-[12px] pt-[8px]">
      <label className={INFO_LABEL}>
        신발ID
        <Field
          variant="mono"
          value={form.ftwrId}
          readOnly={!isNew || !canEdit}
          invalid={saveError != null}
          maxLength={8}
          onChange={(e) => props.onFormChange({ ...form, ftwrId: e.target.value })}
          className="w-[96px] text-[12.5px]"
        />
      </label>
      {TEXT_FIELDS.map(({ key, label, width }) => (
        <label key={key} className={INFO_LABEL}>
          {label}
          <Field value={form[key] ?? ""} readOnly={!canEdit} onChange={(e) => props.onFormChange({ ...form, [key]: e.target.value })} className={cn(width, "text-[12.5px]")} />
        </label>
      ))}
      {saveError ? (
        <p role="alert" className="m-0 self-center text-[12.5px] text-danger">
          {saveError}
        </p>
      ) : null}
    </section>
  )

  const sole = (
    <section aria-label="밑창 그림" className="flex min-h-0 min-w-0 flex-col border-0 border-r border-solid border-border">
      <div className={cn(BAR, "border-0 border-b border-solid border-border")}>
        <h3 className="m-0 text-[12.5px] font-bold whitespace-nowrap text-foreground">밑창</h3>
        <Segmented
          aria-label="밑창 그림 종류"
          items={[
            { value: "original", label: "원본" },
            { value: "shoerinsics", label: "Shoerinsics" },
          ]}
          value={look}
          onValueChange={(v) => setLook(v === "shoerinsics" ? "shoerinsics" : "original")}
          className={SMALL_SEG}
        />
        {canEdit ? (
          <span className="ml-auto inline-flex items-center gap-[2px]">
            <WorkbenchButton
              size="sm"
              variant="ghost"
              icon={ImagePlus}
              iconOnly
              aria-label={form.image ? "이미지 교체" : "이미지 등록"}
              title={form.image ? "이미지 교체" : "이미지 등록"}
              onClick={props.onReplaceImage}
            />
            <WorkbenchButton size="sm" variant="ghost" icon={RotateCw} iconOnly aria-label="이미지 회전" title="90° 회전" disabled={!form.image} onClick={props.onRotateImage} />
          </span>
        ) : null}
      </div>
      <div className={cn(BAR, "border-0 border-b border-solid border-border py-[4px]")}>
        <ViewControls tune={tune} onTuneChange={setTune} lens={lens} onLensChange={changeLens} rotatable />
      </div>
      <div className="relative min-h-0 flex-1 bg-canvas p-[10px]">
        <LensBox
          enabled={lens.on}
          size={lens.size}
          zoom={lens.zoom}
          source={soleImage(true)}
          tune={cls}
          onSizeStep={(by) => setLens((l) => ({ ...l, size: stepLens(l.size, by) }))}
          onLensMove={setSpot}
          pin={pin}
          onPinChange={setPin}
          lensSlot="shoe-lens"
          className="size-full"
        >
          <div className="relative size-full min-w-0 overflow-hidden rounded-[8px] border border-solid border-line-3 bg-canvas">
            <div className={cn("absolute inset-0", cls.outer)}>
              <div className={cn("absolute inset-0", cls.inner)}>{soleImage(false)}</div>
            </div>
            {form.image ? <SoleZoneLines /> : <span className="absolute inset-0 grid place-items-center text-[12.5px] text-dim">이미지 없음</span>}
            <ScanOverlay active={extracting} />
            <span className={cn(TAG, "top-[6px] right-[6px]")}>{look === "shoerinsics" ? "Shoerinsics 이진화" : "원본"}</span>
            {tuneLabels.length ? <span className={cn(TAG, "top-[30px] right-[6px] text-brand")}>{tuneLabels.join(" · ")}</span> : null}
          </div>
        </LensBox>
      </div>
      <div className={cn(BAR, "border-0 border-t border-solid border-border py-[7px]")}>
        <WorkbenchButton
          variant="soft"
          icon={Sparkles}
          disabled={!canPatternEdit || extracting || !form.image}
          onClick={props.onExtract}
          title="AI 가 밑창에서 상 · 중 · 하 문양을 제안합니다 — 확인은 사람이"
          className="w-full justify-center border-ai-line text-ai hover:border-ai"
        >
          {extracting ? "문양 추출 중…" : "AI 문양 추출"}
        </WorkbenchButton>
      </div>
    </section>
  )

  const zones = (
    <section aria-label="부위별 문양" className="@container flex min-h-0 min-w-0 flex-col bg-canvas">
      <div className={cn(BAR, "border-0 border-b border-solid border-border")}>
        <h3 className="m-0 text-[12.5px] font-bold whitespace-nowrap text-foreground">4부위 문양</h3>
        <span className="font-code text-[11px] text-muted-foreground tabular-nums">{total}개</span>
        {suggestedCount > 0 ? (
          <span className="ml-auto inline-flex items-center gap-[6px]">
            <AiTag variant="done">{`AI 제안 ${suggestedCount}`}</AiTag>
            <WorkbenchButton size="sm" variant="ghost" icon={Check} disabled={!canPatternEdit} onClick={props.onConfirmAi}>
              모두 확인
            </WorkbenchButton>
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-[10px]">
        <PatternZoneBoard
          label="부위별 문양"
          zones={cards}
          selectedZone={zone}
          onSelectZone={setZone}
          onDropToZone={(z, src) => insertTo(z, nameOf(src))}
          onRemove={(z, index) => {
            if (canPatternEdit) setZoneNames(z, form[z].filter((_, i) => i !== index))
          }}
          onConfirm={props.onConfirmAiOne && canPatternEdit ? (z, index) => props.onConfirmAiOne?.(z, form[z][index]) : undefined}
          canEdit={canPatternEdit}
          zoneNote={zoneNote}
          emptyText="오른쪽 목록에서 눌러 넣기"
        />
      </div>
      {detail?.duplicate ? (
        <div className={cn(BAR, "border-0 border-t border-solid border-border py-[6px] text-[11px]")}>
          <AiTag className="border-warn-line bg-warn-bg text-warn">중복 의심</AiTag>
          <span className="min-w-0 truncate text-fg-2">
            <span className="font-code">{detail.duplicate.ftwrId}</span> · 바닥 유사도{" "}
            <b className="font-code text-warn">{detail.duplicate.similarity.toFixed(2)}</b>
          </span>
          <WorkbenchButton size="sm" variant="ghost" className="ml-auto" onClick={() => props.onPlusAction?.("나란히 보기")}>
            나란히 보기
          </WorkbenchButton>
        </div>
      ) : null}
    </section>
  )

  const items: PatternLibraryItem[] = (library[kind] ?? []).map((n) => ({ src: patternSrc(n), name: n, note: SHOE_PATTERN_DESC[n] }))
  const side = (
    <aside aria-label="문양 고르기" className="flex min-h-0 min-w-0 flex-col gap-[10px] border-0 border-l border-solid border-border pl-[12px]">
      <PatternPeek
        lens={lens.on ? { spot: pin ?? spot, zoom: lens.zoom, source: soleImage(true), tune: cls, pinned: pin !== null } : null}
        pattern={hovered}
        subject="밑창"
      />
      <PatternLibrary
        tabs={kinds.map((k) => ({ key: k, label: k, count: library[k]?.length }))}
        tab={kind}
        onTabChange={setKind}
        items={items}
        itemsLabel={`${kind} 문양 ${items.length}개`}
        insertedNames={form[zone]}
        zoneLabel={zoneLabel}
        onToggle={toggle}
        onHoverItem={(it) => (it ? setHovered(it) : undefined)}
        canEdit={canPatternEdit}
        className="min-h-0 flex-1"
      />
    </aside>
  )

  return (
    <section ref={rootRef} aria-label={isNew ? "신발 등록" : `신발 ${form.ftwrId} 편집`} data-slot="shoe-editor" data-esc-layer="" className="flex h-full min-h-0 flex-col">
      {head}
      {info}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px] gap-[12px] p-[12px]">
        <div
          data-theme="dark"
          data-slot="shoe-workbench"
          className="grid min-h-0 grid-cols-[minmax(240px,320px)_minmax(0,1fr)] overflow-hidden rounded-[12px] border border-solid border-border bg-panel text-foreground [box-shadow:0_6px_18px_var(--t-panel-drop)]"
        >
          {sole}
          {zones}
        </div>
        {side}
      </div>
    </section>
  )
}

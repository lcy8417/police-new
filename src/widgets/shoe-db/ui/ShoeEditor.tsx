import * as React from "react"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ImagePlus, RotateCw, Save, Sparkles, X } from "lucide-react"

import { insertPatternPath } from "@/entities/pattern"
import type { Shoe } from "@/entities/shoe"
import { cn } from "@/shared/lib/utils"
import { AiTag, ScanOverlay } from "@/shared/ui/ai"
import { Field, Segmented, WorkbenchButton } from "@/shared/ui/kit"
import { PaneHead, UnderlineTabs } from "@/shared/ui/panel"
import {
  DEFAULT_LENS,
  DEFAULT_VIEW_TUNE,
  LensBox,
  PatternIcon,
  ViewControls,
  stepLens,
  viewTuneClass,
  viewTuneLabels,
  type LensSettings,
  type ViewTune,
} from "@/shared/ui/viewer"

import { SHOE_PATTERN_DESC } from "../model/palette"
import type { ShoeAiDetail, ShoeDialogState, ShoeExtractState, ShoeWorkStatus } from "../model/types"

type ZoneKey = "top" | "mid" | "bottom" | "outline"
type EditorTab = "basic" | "pattern"
type SoleLook = "original" | "shoerinsics"

const ZONES: { key: ZoneKey; label: string }[] = [
  { key: "top", label: "상" },
  { key: "mid", label: "중" },
  { key: "bottom", label: "하" },
  { key: "outline", label: "윤곽" },
]

const TEXT_FIELDS: { key: "modlNm" | "brandCode" | "makrCode" | "colctPlace" | "colctYear"; label: string }[] = [
  { key: "modlNm", label: "모델명" },
  { key: "brandCode", label: "상표코드" },
  { key: "makrCode", label: "제조사코드" },
  { key: "colctPlace", label: "수집처" },
  { key: "colctYear", label: "수집연도" },
]

const LOW = 0.7
/** 작업판 막대(문양 코드 탭 작업판과 같은 결) */
const BAR = "flex shrink-0 flex-wrap items-center gap-x-[8px] gap-y-[4px] bg-panel px-[10px] py-[5px]"
/** 그림 위 꼬리표 */
const TAG = "pointer-events-none absolute rounded-[5px] bg-canvas/90 px-[7px] py-[2px] font-code text-[10.5px] text-fg-2"
/** Shoerinsics 이진화 그림 근사(진열 — 운영은 서버 `/shoes_images/Shoerinsics/<ftwrId>.png`) */
const SHOERINSICS = "grayscale contrast-[8]"
const SMALL_SEG = "p-[2px] [&_button]:px-[7px] [&_button]:py-[1px] [&_button]:text-[11px]"
const patternSrc = (name: string) => String(insertPatternPath(name))

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
  canEdit: boolean
  isAdmin: boolean
  detail?: ShoeAiDetail
  workStatus?: ShoeWorkStatus
  /** 종류별 전체 문양 이름 */
  library: Record<string, readonly string[]>
  extractState: ShoeExtractState
  onExtract: () => void
  /** AI 가 넣은 문양을 모두 확인(AI 테 지움) */
  onConfirmAi: () => void
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
 * 신발 등록 · 편집 판(신발 DB 패널 안 — 목록 자리를 채운다. 11/17 사용자 「신발 등록도 문양 추출이 있는 거 알지?? 그리고 여기서도
 * 슈링식스 이진화, 그리고 확대 대비 반전 등으로 상중하 나뉘어서 문양을 수동으로 집어 넣어야해」).
 *   위 한 줄: ← 목록 · 신발ID · 기본정보 | 문양정보 탭 ……… ‹ › · 저장 · 승인
 *   문양정보: 먹색 작업판(왼쪽 밑창 — 원본 / Shoerinsics · 보기 조정 · 확대경 · 상중하 경계선 · AI 문양 추출 | 가운데 상 · 중 · 하 · 윤곽 칸)
 *            + 오른쪽 밝은 칸 문양 목록(종류 탭 + 격자 — 누르면 고른 부위에 넣고, 다시 누르면 뺀다)
 * 신발 문양은 이름 문자열 배열이다(docs/pattern-data-model.md §2). 비교 · 중복 판정도 이름 기준.
 */
export function ShoeEditor(props: ShoeEditorProps) {
  const { dialog, canEdit, isAdmin, detail, workStatus, library, extractState } = props
  const { form, mode, saveError } = dialog
  const isNew = mode === "new"
  const [tab, setTab] = React.useState<EditorTab>(dialog.initialTab ?? (isNew ? "basic" : "pattern"))
  const [zone, setZone] = React.useState<ZoneKey>("top")
  const kinds = Object.keys(library)
  const [kind, setKind] = React.useState(kinds[0] ?? "")
  const [look, setLook] = React.useState<SoleLook>("original")
  const [tune, setTune] = React.useState<ViewTune>(DEFAULT_VIEW_TUNE)
  const [lens, setLens] = React.useState<LensSettings>(DEFAULT_LENS)
  const aiNames = dialog.aiNames ?? []
  const extracting = extractState === "running"
  const cls = viewTuneClass(tune)
  const tuneLabels = viewTuneLabels(tune)
  const zoneLabel = ZONES.find((z) => z.key === zone)?.label ?? ""
  const total = ZONES.reduce((n, z) => n + form[z.key].length, 0)
  const conf: Partial<Record<ZoneKey, number>> = detail ? detail.conf : {}

  const onChangeZone = (key: ZoneKey, names: string[]) => props.onFormChange({ ...form, [key]: names })
  // 이름 기준으로 넣고 빼기(같은 부위에 같은 이름 두 번 없음)
  const toggle = (name: string) => {
    if (!canEdit) return
    const list = form[zone]
    onChangeZone(zone, list.includes(name) ? list.filter((n) => n !== name) : [...list, name])
  }

  const soleImage = (copy: boolean) =>
    form.image ? (
      <img src={form.image} alt={copy ? "" : `${form.ftwrId} 밑창`} className={cn("size-full object-contain", look === "shoerinsics" && SHOERINSICS)} />
    ) : null

  const head = (
    <UnderlineTabs<EditorTab>
      label="신발 정보"
      tabs={[
        ["basic", "기본정보"],
        ["pattern", "문양정보"],
      ]}
      value={tab}
      onChange={setTab}
      lead={
        <span className="mr-[10px] inline-flex min-w-0 items-center gap-[8px] self-center">
          <WorkbenchButton size="sm" variant="ghost" icon={ArrowLeft} onClick={props.onClose}>
            목록
          </WorkbenchButton>
          <b className="font-code text-[13px] text-foreground">{isNew ? "새 신발" : form.ftwrId}</b>
          {form.modlNm ? <span className="max-w-[220px] truncate text-[12px] text-muted-foreground">{form.modlNm}</span> : null}
          {workStatus ? <span className="rounded-[5px] bg-strip px-[6px] py-px text-[11px] text-fg-2">{workStatus}</span> : null}
        </span>
      }
      end={
        <>
          <WorkbenchButton size="sm" variant="ghost" icon={ChevronLeft} iconOnly aria-label="이전 신발" disabled={!props.onPrev} onClick={props.onPrev} />
          <WorkbenchButton size="sm" variant="ghost" icon={ChevronRight} iconOnly aria-label="다음 신발" disabled={!props.onNext} onClick={props.onNext} />
          {canEdit ? (
            <>
              <WorkbenchButton size="sm" variant="soft" icon={Check} disabled={!isAdmin || isNew} title="승인 담당만" onClick={props.onApprove}>
                승인
              </WorkbenchButton>
              <WorkbenchButton size="sm" variant="primary" icon={Save} onClick={props.onSave}>
                저장
              </WorkbenchButton>
            </>
          ) : null}
        </>
      }
    />
  )

  const basic = (
    <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] content-start gap-[18px] overflow-auto p-[16px]">
      <div className="grid content-start gap-[8px]">
        <div className="flex h-[300px] items-center justify-center overflow-hidden rounded-[10px] border border-solid border-border bg-canvas">
          {form.image ? <img src={form.image} alt="신발 바닥 이미지" className="size-full object-contain" /> : <span className="text-[12px] text-dim">이미지 없음</span>}
        </div>
        {canEdit ? (
          <div className="flex gap-[6px]">
            <WorkbenchButton size="sm" variant="soft" icon={ImagePlus} onClick={props.onReplaceImage}>
              {form.image ? "이미지 교체" : "이미지 등록"}
            </WorkbenchButton>
            <WorkbenchButton size="sm" variant="ghost" icon={RotateCw} disabled={!form.image} onClick={props.onRotateImage}>
              회전
            </WorkbenchButton>
          </div>
        ) : null}
      </div>
      <div className="grid max-w-[640px] content-start gap-[8px]">
        <label className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-[8px] text-[12.5px] text-muted-foreground">
          <span>신발ID</span>
          <Field
            variant="mono"
            value={form.ftwrId}
            readOnly={!isNew || !canEdit}
            invalid={saveError != null}
            maxLength={8}
            onChange={(e) => props.onFormChange({ ...form, ftwrId: e.target.value })}
          />
        </label>
        {saveError ? (
          <p role="alert" className="m-0 pl-[96px] text-[12px] text-danger">
            {saveError}
          </p>
        ) : null}
        {TEXT_FIELDS.map(({ key, label }) => (
          <label key={key} className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-[8px] text-[12.5px] text-muted-foreground">
            <span>{label}</span>
            <Field value={form[key] ?? ""} readOnly={!canEdit} onChange={(e) => props.onFormChange({ ...form, [key]: e.target.value })} />
          </label>
        ))}
      </div>
    </div>
  )

  const sole = (
    <section aria-label="밑창 그림" className="flex min-h-0 min-w-0 flex-col border-0 border-r border-solid border-border">
      <div className={cn(BAR, "border-0 border-b border-solid border-border")}>
        <h3 className="m-0 text-[12px] font-bold whitespace-nowrap text-foreground">밑창</h3>
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
      </div>
      <div className={cn(BAR, "border-0 border-b border-solid border-border py-[4px]")}>
        <ViewControls tune={tune} onTuneChange={setTune} lens={lens} onLensChange={setLens} rotatable />
      </div>
      <div className="relative min-h-0 flex-1 bg-canvas p-[10px]">
        <LensBox
          enabled={lens.on}
          size={lens.size}
          zoom={lens.zoom}
          source={soleImage(true)}
          tune={cls}
          onSizeStep={(by) => setLens((l) => ({ ...l, size: stepLens(l.size, by) }))}
          lensSlot="shoe-lens"
          className="size-full"
        >
          <div className="relative size-full min-w-0 overflow-hidden rounded-[8px] border border-solid border-line-3 bg-canvas">
            <div className={cn("absolute inset-0", cls.outer)}>
              <div className={cn("absolute inset-0", cls.inner)}>{soleImage(false)}</div>
            </div>
            {form.image ? <SoleZoneLines /> : <span className="absolute inset-0 grid place-items-center text-[12px] text-dim">이미지 없음</span>}
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
          disabled={!canEdit || extracting || !form.image}
          onClick={props.onExtract}
          title="AI 가 밑창에서 상 · 중 · 하 문양을 제안합니다 — 확인은 사람이"
          className="w-full justify-center border-ai-line text-ai hover:border-ai"
        >
          {extracting ? "문양 추출 중…" : "AI 문양 추출"}
        </WorkbenchButton>
      </div>
    </section>
  )

  const zoneRow = ({ key, label }: { key: ZoneKey; label: string }) => {
    const names = form[key]
    const on = zone === key
    const c = conf[key]
    return (
      <div
        key={key}
        data-zone={key}
        onClick={() => setZone(key)}
        className={cn(
          "flex min-h-[60px] cursor-pointer items-center gap-[10px] rounded-[9px] border border-solid px-[10px] py-[6px]",
          on ? "border-brand bg-brand-bg" : "border-border bg-panel hover:border-line-3",
        )}
      >
        <button
          type="button"
          aria-pressed={on}
          aria-label={`${label} 부위 고르기`}
          className="grid w-[38px] shrink-0 cursor-pointer justify-items-start gap-[1px] border-0 bg-transparent p-0 text-left"
        >
          <span className={cn("text-[13px] font-bold", on ? "text-brand" : "text-foreground")}>{label}</span>
          <span className="font-code text-[10.5px] text-muted-foreground tabular-nums">{names.length}</span>
        </button>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-[8px]">
          {names.length === 0 ? (
            <span className="text-[11.5px] text-faint">{on ? "오른쪽 목록에서 눌러 넣기" : "—"}</span>
          ) : (
            names.map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${label} ${n} 빼기`}
                title={`${n} — 눌러서 빼기`}
                disabled={!canEdit}
                onClick={(e) => {
                  e.stopPropagation()
                  onChangeZone(key, names.filter((x) => x !== n))
                }}
                className="group relative cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default"
              >
                <PatternIcon name={n} src={patternSrc(n)} size="lg" ai={aiNames.includes(n)} />
                <span
                  aria-hidden="true"
                  className="absolute -top-[5px] -right-[5px] hidden size-[15px] place-items-center rounded-full bg-danger text-paper group-hover:grid group-focus-visible:grid"
                >
                  <X className="size-[10px]" />
                </span>
              </button>
            ))
          )}
        </span>
        {c !== undefined ? (
          <span
            title={`${label} AI 확신도`}
            className={cn("shrink-0 font-code text-[11px] tabular-nums", c < LOW ? "text-warn" : "text-muted-foreground")}
          >
            {c < LOW ? "확인 " : ""}
            {c.toFixed(2)}
          </span>
        ) : null}
      </div>
    )
  }

  const zones = (
    <section aria-label="부위별 문양" className="flex min-h-0 min-w-0 flex-col bg-canvas">
      <div className={cn(BAR, "border-0 border-b border-solid border-border")}>
        <h3 className="m-0 text-[12px] font-bold whitespace-nowrap text-foreground">상 · 중 · 하 문양</h3>
        <span className="font-code text-[11px] text-muted-foreground tabular-nums">{total}개</span>
        {aiNames.length > 0 ? (
          <span className="ml-auto inline-flex items-center gap-[6px]">
            <AiTag variant="done">{`AI 제안 ${aiNames.length}`}</AiTag>
            <WorkbenchButton size="sm" variant="ghost" icon={Check} disabled={!canEdit} onClick={props.onConfirmAi}>
              모두 확인
            </WorkbenchButton>
          </span>
        ) : null}
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-[minmax(60px,1fr)] gap-[6px] overflow-auto p-[10px]">{ZONES.map(zoneRow)}</div>
      {detail?.duplicate ? (
        <div className={cn(BAR, "border-0 border-t border-solid border-border py-[6px] text-[11.5px]")}>
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

  const names = library[kind] ?? []
  const inZone = form[zone]
  const palette = (
    <aside aria-label="문양 목록" className="ml-[12px] flex min-h-0 min-w-0 flex-col border-0 border-l border-solid border-border pl-[12px]">
      <PaneHead title="문양 목록" sub={`넣을 부위 · ${zoneLabel}`} />
      {/* 종류 8개가 좁은 칸 한 줄에 들도록 촘촘한 밑줄 탭(UnderlineTabs 와 같은 결 · 글자 12 · 좌우 6) */}
      <div role="tablist" aria-label="문양 종류" className="flex shrink-0 border-0 border-b border-solid border-border">
        {kinds.map((k) => {
          const on = k === kind
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setKind(k)}
              className={cn(
                "-mb-px flex-1 cursor-pointer border-0 border-b-2 border-solid bg-transparent px-[4px] pt-[6px] pb-[6px] text-[12px] font-bold whitespace-nowrap",
                on ? "border-brand text-brand-3" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {k}
            </button>
          )
        })}
      </div>
      <div
        role="group"
        aria-label="문양 격자"
        className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(40px,1fr))] content-start gap-[6px] overflow-y-auto py-[10px]"
      >
        {names.map((n) => {
          const inside = inZone.includes(n)
          const desc = SHOE_PATTERN_DESC[n]
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} ${inside ? "빼기" : "넣기"}`}
              aria-pressed={inside}
              title={desc ? `${n} — ${desc}` : n}
              disabled={!canEdit}
              onClick={() => toggle(n)}
              className="relative grid cursor-pointer place-items-center border-0 bg-transparent p-0 disabled:cursor-default"
            >
              <PatternIcon name={n} src={patternSrc(n)} size="md" selected={inside} title={desc ? `${n} — ${desc}` : n} />
              {inside ? (
                <span aria-hidden="true" className="absolute -top-[3px] -right-[1px] grid size-[14px] place-items-center rounded-full bg-brand text-paper">
                  <Check className="size-[10px]" />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </aside>
  )

  return (
    <section aria-label={isNew ? "신발 등록" : `신발 ${form.ftwrId} 편집`} data-slot="shoe-editor" className="flex h-full min-h-0 flex-col">
      {head}
      {tab === "basic" ? (
        basic
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_296px] p-[12px]">
          <div
            data-theme="dark"
            data-slot="shoe-workbench"
            className="grid min-h-0 grid-cols-[minmax(260px,340px)_minmax(0,1fr)] overflow-hidden rounded-[12px] border border-solid border-border bg-panel text-foreground [box-shadow:0_6px_18px_var(--t-panel-drop)]"
          >
            {sole}
            {zones}
          </div>
          {palette}
        </div>
      )}
    </section>
  )
}

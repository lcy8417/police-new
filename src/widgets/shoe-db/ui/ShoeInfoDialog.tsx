import * as React from "react"

import { insertPatternPath } from "@/entities/pattern"
import type { Shoe } from "@/entities/shoe"
import { cn } from "@/shared/lib/utils"
import { AiTag, ConfidenceBar, ScanOverlay } from "@/shared/ui/ai"
import { Button, Chip, DialogShell, Field, Segmented } from "@/shared/ui/kit"
import { ButtonBar } from "@/shared/ui/panel"
import { PatternIcon } from "@/shared/ui/viewer"

import { SHOE_PALETTE, SHOE_PALETTE_CATEGORIES, SHOE_PATTERN_DESC } from "../model/palette"
import type { ShoeAiDetail, ShoeDialogState, ShoeWorkStatus } from "../model/types"

// 신발정보관리 레이어 창(1겹). 기본정보 · 문양정보 두 탭(SCAS 순서).
// 신규(showPlus): 문양정보 탭의 AI 1차 입력 · 확신도 · 가림 · 중복 의심 · 고르기 줄 · 진행 · 승인 조건.
interface ShoeInfoDialogProps {
  dialog: ShoeDialogState
  canEdit: boolean
  isAdmin: boolean
  /** 인공지능문양관리 — 문양 수집 검수 권한(SHOE_COLLECT_REVIEW) */
  canAiReview: boolean
  showPlus: boolean
  onPlusAction: (action: string) => void
  detail?: ShoeAiDetail
  workStatus?: ShoeWorkStatus
  onFormChange: (form: Shoe) => void
  onSave: () => void
  onClose: () => void
  onReplaceImage: () => void
  onRotateImage: () => void
}

type ZoneKey = "top" | "mid" | "bottom" | "outline"

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
const WARN_TAG = "border-warn-line bg-warn-bg text-warn"
const patternSrc = (name: string) => String(insertPatternPath(name))

// 신발 이미지 위: 상 · 중 · 하 확신도 표식, 가림 칸, 가격표 조각, 스캔선(시안 바닥 이미지 칸)
const ZONE_TAG_TOP: Record<"top" | "mid" | "bottom", string> = { top: "top-[6%]", mid: "top-[40%]", bottom: "top-[70%]" }

function SoleAiOverlay({ detail }: { detail: ShoeAiDetail }) {
  const tags: { key: "top" | "mid" | "bottom"; label: string }[] = [
    { key: "top", label: "상" },
    { key: "mid", label: "중" },
    { key: "bottom", label: "하" },
  ]
  return (
    <>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[36%] border-t border-dashed border-ai opacity-80" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[66%] border-t border-dashed border-ai opacity-80" />
      {tags.map(({ key, label }) => (
        <AiTag key={key} variant="done" className={cn("absolute left-[6px]", ZONE_TAG_TOP[key], detail.conf[key] < LOW && WARN_TAG)}>
          {`${label} ${detail.conf[key].toFixed(2)}`}
        </AiTag>
      ))}
      <span aria-hidden="true" className="pointer-events-none absolute top-[39%] left-[41%] h-[44px] w-[78px] rounded-[4px] border-[1.5px] border-dashed border-warn" />
      <span className="pointer-events-none absolute top-[calc(39%-14px)] left-[41%] font-code text-[9.5px] font-semibold text-warn">
        {`가림 ${detail.occlusion.percent}%`}
      </span>
      <ScanOverlay active />
      <span className="pointer-events-none absolute top-[43%] left-[44%] grid h-[30px] w-[62px] -rotate-[8deg] place-items-center rounded-[4px] bg-warn text-[10px] font-bold text-canvas opacity-85">
        {detail.occlusion.obstacle}
      </span>
    </>
  )
}

export function ShoeInfoDialog({
  dialog,
  canEdit,
  isAdmin,
  canAiReview,
  showPlus,
  onPlusAction,
  detail,
  workStatus,
  onFormChange,
  onSave,
  onClose,
  onReplaceImage,
  onRotateImage,
}: ShoeInfoDialogProps) {
  const [tab, setTab] = React.useState(dialog.initialTab ?? "basic")
  // 화면 안에서만 쓰는 고르기 상태(저장 값 아님)
  const [selZone, setSelZone] = React.useState<ZoneKey>("bottom")
  const [category, setCategory] = React.useState("내부선")
  const [picked, setPicked] = React.useState("n32_04")
  const [line, setLine] = React.useState("단선")
  const { form, mode, saveError } = dialog
  const isNew = mode === "new"
  const idInvalid = saveError != null
  const plus = showPlus && detail != null
  const plan = (what: string) => () => onPlusAction(what)
  const conf: Partial<Record<ZoneKey, number>> = detail ? { top: detail.conf.top, mid: detail.conf.mid, bottom: detail.conf.bottom } : {}
  const desc = SHOE_PATTERN_DESC[picked]

  const tabRow = (
    <div className="flex flex-wrap items-center gap-[6px]">
      <Segmented
        scas
        aria-label="신발정보 탭"
        value={tab}
        onValueChange={(v) => setTab(v === "pattern" ? "pattern" : "basic")}
        items={[
          { value: "basic", label: "기본정보" },
          { value: "pattern", label: "문양정보" },
        ]}
      />
      {showPlus && workStatus && (
        <span data-plus="" className="inline-flex items-center gap-[6px]">
          <span className="font-code text-[12px] text-brand">{form.ftwrId}</span>
          {workStatus === "AI 확인 필요" && <Chip variant="amber">{workStatus}</Chip>}
        </span>
      )}
      <span className="ml-auto flex flex-wrap items-center gap-[5px]">
        {showPlus && canAiReview && (
          <span data-plus="" className="inline-flex">
            <Button size="sm" variant="ai" onClick={plan("인공지능문양관리")}>
              인공지능문양관리
            </Button>
          </span>
        )}
        {showPlus && (
          <span data-plus="" className="inline-flex items-center gap-[5px]">
            <Button size="sm" onClick={plan("이전")}>
              이전
            </Button>
            <Button size="sm" onClick={plan("다음")}>
              다음
            </Button>
            {canEdit && (
              <>
                <Button size="sm" variant="ok" locked={!isAdmin} title="신발 승인 권한이 있는 승인 담당만" onClick={plan("승인")}>
                  승인
                </Button>
                <Button size="sm" onClick={plan("그룹등록")}>
                  그룹등록
                </Button>
              </>
            )}
          </span>
        )}
      </span>
    </div>
  )

  const zoneRow = (key: ZoneKey, label: string) => {
    const names = form[key]
    const aiRow = plus && key !== "outline"
    const c = conf[key]
    const warn = c !== undefined && c < LOW
    const on = showPlus && selZone === key
    return (
      <div
        key={key}
        onClick={() => setSelZone(key)}
        className={cn(
          "grid min-h-[42px] grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-[8px] rounded-[7px] border border-solid px-[8px] py-[4px]",
          on ? "border-brand bg-brand-bg" : "border-line-2 bg-strip",
        )}
      >
        <span className={cn("text-[12.5px] font-semibold", on ? "text-foreground" : "text-muted-foreground")}>{label}</span>
        <span className="flex flex-wrap items-center gap-[5px]">
          {names.length === 0 ? (
            <span className="text-[12px] text-dim">—</span>
          ) : (
            names.map((name) => <PatternIcon key={name} name={name} src={patternSrc(name)} size="sm" ai={aiRow} />)
          )}
        </span>
        <span data-plus={showPlus ? "" : undefined} className="flex items-center gap-[6px]">
          {aiRow && c !== undefined && (
            <span className={cn("inline-flex items-center gap-[6px] text-[11px]", warn ? "text-warn" : "text-ai")}>
              <span className="text-[10.5px] text-dim">AI 확신도</span>
              <ConfidenceBar value={c} scale="unit" threshold={LOW} label={`${label} AI 확신도`} className="w-[86px]" />
              {warn && detail && <Chip variant="amber-h18" className="h-[20px] text-[10.5px]">{`확인 필요 · ${detail.occlusion.obstacle}가 가림`}</Chip>}
            </span>
          )}
          {plus && key === "outline" && <span className="text-[11px] text-dim">AI 미지원 · 사람이 입력</span>}
        </span>
      </div>
    )
  }

  const patternTab = (
    <div className={cn("grid gap-[14px]", plus && "grid-cols-[250px_minmax(0,1fr)]")}>
      {plus && detail && (
        <div data-plus="" className="grid content-start gap-[8px]">
          <span className="text-[11.5px] text-muted-foreground">바닥 이미지</span>
          <span className="relative block h-[270px] overflow-hidden rounded-[8px] border border-solid border-line-2 bg-canvas">
            {form.image && <img src={form.image} alt="신발 바닥 이미지(AI 표시)" className="size-full object-contain" />}
            <SoleAiOverlay detail={detail} />
          </span>
          <div className="grid grid-cols-3 gap-[6px] text-center text-[11px]">
            <span className="grid h-[38px] place-items-center rounded-[8px] border border-solid border-line-2 bg-panel-2 text-ok">측면 ✓</span>
            <span className="grid h-[38px] place-items-center rounded-[8px] border border-solid border-line-2 bg-panel-2 text-faint">전/후면 ＋</span>
            <span className="grid h-[38px] place-items-center rounded-[8px] border border-solid border-line-2 bg-panel-2 text-faint">로고 ＋</span>
          </div>
          {desc && (
            <div className="rounded-[8px] border border-solid border-line-2 bg-strip px-[10px] py-[8px] text-[11.5px] leading-[1.5] text-fg-2">
              <span className="mb-[3px] block text-[11.5px] text-muted-foreground">코드 설명</span>
              <PatternIcon name={picked} src={patternSrc(picked)} size="sm" className="align-middle" />{" "}
              <b className="font-code text-brand">{picked}</b> {desc}
            </div>
          )}
        </div>
      )}
      <div className="grid content-start gap-[6px]">
        <span className="text-[11.5px] text-muted-foreground">신발 문양</span>
        {plus && detail && (
          <div data-plus="" className="flex items-center gap-[8px] rounded-[7px] border border-solid border-ai-line bg-ai-bg px-[10px] py-[6px] text-[11.5px]">
            <AiTag variant="progress">AI 1차 입력</AiTag>
            <span className="text-fg-2">
              상·하가 같은 {detail.sameKind.label}(<span className="font-code">{detail.sameKind.code}</span>)이라 <b className="text-foreground">한 번에</b> 채움 · {detail.sameKind.hint}
            </span>
            <span className="ml-auto text-[11px] text-dim">확정은 문양 입력 담당</span>
          </div>
        )}
        {ZONES.map(({ key, label }) => zoneRow(key, label))}
        <div className="grid min-h-[42px] grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-[8px] rounded-[7px] border border-solid border-line-2 bg-strip px-[8px] py-[4px]">
          <span className="text-[12.5px] font-semibold text-muted-foreground">문자열</span>
          <span className="text-[11.5px] text-faint">—</span>
          {canEdit ? (
            <Button size="sm" variant="pri" onClick={onSave}>
              저장
            </Button>
          ) : (
            <span />
          )}
        </div>
        {plus && canEdit && (
          <div data-plus="" className="grid gap-[6px]">
            <div className="flex items-center gap-[8px] rounded-[7px] border border-dashed border-line-3 px-[8px] py-[5px]">
              <PatternIcon name={picked} src={patternSrc(picked)} size="sm" selected />
              <span className="text-[12px] text-fg-2">고른 문양을</span>
              <Button size="sm" onClick={plan("상·중·하 모두에 넣기")}>
                상·중·하 모두에 넣기
              </Button>
            </div>
          </div>
        )}
        {showPlus && canEdit && (
          <div data-plus="" className="grid gap-[6px]">
            <div className="flex flex-wrap gap-[4px]">
              {SHOE_PALETTE_CATEGORIES.map((c) => (
                <Chip key={c} variant={c === category ? "blue-h20" : "h19"} on={c === category} className="h-[20px] cursor-pointer text-[11px]" onClick={() => setCategory(c)}>
                  {c}
                </Chip>
              ))}
              <span className="inline-flex h-[22px] min-w-[150px] flex-1 items-center rounded-[6px] border border-solid border-line-3 bg-canvas px-[8px] text-[11.5px] text-dim">⌕ 문양 이름·설명 검색</span>
            </div>
            <div className="flex flex-wrap gap-[4px]">
              {(SHOE_PALETTE[category] ?? []).map((n) => (
                <button key={n} type="button" aria-label={`문양 ${n}`} onClick={() => setPicked(n)} className="cursor-pointer border-0 bg-transparent p-0">
                  <PatternIcon name={n} src={patternSrc(n)} size="sm" selected={n === picked} />
                </button>
              ))}
            </div>
            <div className="flex gap-[4px]">
              {["단선", "다선1", "다선2"].map((l) => (
                <Chip key={l} variant={l === line ? "blue-h20" : "h19"} on={l === line} className="h-[20px] cursor-pointer text-[11px]" onClick={() => setLine(l)}>
                  {l}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {plus && detail?.duplicate && (
          <div data-plus="" className="grid grid-cols-[44px_44px_minmax(0,1fr)_auto] items-center gap-[10px] rounded-[8px] border border-solid border-warn-line bg-warn-bg px-[10px] py-[8px]">
            {[{ id: form.ftwrId, src: form.image }, { id: detail.duplicate.ftwrId, src: detail.duplicate.image }].map((t) => (
              <span key={t.id} className="grid gap-[2px] text-center text-[9.5px] text-dim">
                <span className="grid h-[58px] place-items-center overflow-hidden rounded-[5px] bg-picon">{t.src && <img src={t.src} alt="" className="size-full object-contain" />}</span>
                <span className="font-code">{t.id}</span>
              </span>
            ))}
            <span className="grid gap-[2px] text-[11.5px] leading-[1.45]">
              <span>
                <AiTag className={WARN_TAG}>AI 중복 의심</AiTag>{" "}
                <b className="text-foreground">
                  이미 등록된 <span className="font-code">{detail.duplicate.ftwrId}</span>와 바닥이 거의 같음
                </b>
              </span>
              <span className="text-fg-2">
                바닥 유사도 <b className="font-code text-warn">{detail.duplicate.similarity.toFixed(2)}</b> · 같은 상표 · {detail.duplicate.registeredAt} 등록(예시)
              </span>
              <span className="text-dim">같은 신발이면 등록 취소, 연도만 바뀐 재출시면 같은 그룹으로 연결</span>
            </span>
            <span className="grid gap-[4px]">
              <Button size="sm" onClick={plan("나란히 보기")}>
                나란히 보기
              </Button>
              {canEdit && (
                <Button size="sm" onClick={plan("그룹으로 연결")}>
                  그룹으로 연결
                </Button>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <DialogShell
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="신발정보관리"
      size="large"
      actions={
        canEdit && tab === "basic" ? (
          <ButtonBar variant="modal-head">
            <Button size="sm" variant="pri" onClick={onSave}>
              저장
            </Button>
          </ButtonBar>
        ) : null
      }
    >
      <div className="grid gap-[12px] p-[14px]">
        {tabRow}
        {tab === "basic" ? (
          <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-[14px]">
            <div className="grid content-start gap-[8px]">
              <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-[8px] border border-solid border-border bg-canvas">
                {form.image ? <img src={form.image} alt="신발 바닥 이미지" className="size-full object-contain" /> : <span className="text-[12px] text-dim">이미지 없음</span>}
              </div>
              {canEdit && (
                <div className="flex gap-[6px]">
                  <Button size="sm" onClick={onReplaceImage}>
                    {form.image ? "이미지 교체" : "이미지 등록"}
                  </Button>
                  <Button size="sm" disabled={!form.image} onClick={onRotateImage}>
                    회전
                  </Button>
                </div>
              )}
            </div>
            <div className="grid content-start gap-[8px]">
              <label className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-[8px] text-[12.5px] text-muted-foreground">
                <span>신발ID</span>
                <Field
                  variant="mono"
                  value={form.ftwrId}
                  readOnly={!isNew || !canEdit}
                  invalid={idInvalid}
                  maxLength={8}
                  onChange={(e) => onFormChange({ ...form, ftwrId: e.target.value })}
                />
              </label>
              {saveError && (
                <p role="alert" className="m-0 pl-[104px] text-[12px] text-danger">
                  {saveError}
                </p>
              )}
              {TEXT_FIELDS.map(({ key, label }) => (
                <label key={key} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-[8px] text-[12.5px] text-muted-foreground">
                  <span>{label}</span>
                  <Field value={form[key] ?? ""} readOnly={!canEdit} onChange={(e) => onFormChange({ ...form, [key]: e.target.value })} />
                </label>
              ))}
            </div>
          </div>
        ) : (
          patternTab
        )}
        {plus && detail && (
          <div data-plus="" className="flex flex-wrap items-center gap-[8px] rounded-[8px] border border-solid border-line-2 bg-strip px-[14px] py-[9px] text-[11.5px]">
            <span className="text-muted-foreground">진행</span>
            <Chip>{detail.flow.registered}</Chip>
            <span aria-hidden="true" className="text-faint">→</span>
            <Chip>{detail.flow.patterned}</Chip>
            <span aria-hidden="true" className="text-faint">→</span>
            <Chip variant="blue">{detail.flow.current}</Chip>
            <span className="ml-auto text-muted-foreground">승인 조건</span>
            {detail.conditions.ok.map((t) => (
              <span key={t} className="text-ok">{t} ✓</span>
            ))}
            {detail.conditions.warn && <span className="text-warn">{detail.conditions.warn}</span>}
          </div>
        )}
      </div>
    </DialogShell>
  )
}

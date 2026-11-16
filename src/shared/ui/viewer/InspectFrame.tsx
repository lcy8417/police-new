import * as React from "react"
import { Eye, Maximize2, Minus, Plus, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { WorkbenchButton } from "@/shared/ui/kit"

import { LensBox } from "./LensBox"
import { stepLens, viewTuneClass, viewTuneLabels, type LensSettings, type ViewTune } from "./view-tune"
import { ViewControls } from "./ViewControls"

/** 확대 범위(%) · 걸음 — 100 = 맞춤 */
/** 초점이 갈 수 있는 것(초점 가두기) */
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const ZOOM_MIN = 100
const ZOOM_MAX = 400
const ZOOM_STEP = 25

export interface InspectFrameProps {
  /** 머리 제목(기본 「살펴보기」) */
  title?: string
  /** 제목 옆(번호 · 원본/편집본 고르기 등) */
  meta?: React.ReactNode
  /** 크게 볼 그림(누를 수 없는 복사본) */
  source?: React.ReactNode
  /** 그림 이름(접근성) */
  sourceLabel?: string
  tune: ViewTune
  onTuneChange: (next: ViewTune) => void
  lens: LensSettings
  onLensChange: (next: LensSettings) => void
  /** 회전 단추 */
  rotatable?: boolean
  /** 오른쪽 칸(예: 문양 목록) — 없으면 그림만 꽉 */
  aside?: React.ReactNode
  /** 확대경 `data-slot` */
  lensSlot?: string
  /** 틀 `data-slot` */
  slot?: string
  onClose: () => void
}

/**
 * 공용 크게 살펴보기 틀(11/17 사용자 「좌의 이미지를 보통 더블 클릭하면 새로운 편집 창이 열리거든?? 거기서 대비, 확대 등등」).
 * 부모(relative)를 덮는 먹색 판: 큰 그림(휠 · − + 확대, 끌어서 이동, 두 번 누르면 맞춤) + 공용 보기 조정 + 확대경, 오른쪽 칸은 화면이 채운다.
 * 보기 조정은 저장하지 않는다. Esc · 닫기로 돌아간다(capture 로 먼저 받아 사건 창은 닫지 않음).
 * 그림 자리 · 크기는 런타임 값이라 인라인 style(CLAUDE.md 예외 — 위치 · 크기만).
 */
export function InspectFrame({
  title = "살펴보기",
  meta,
  source,
  sourceLabel = "그림",
  tune,
  onTuneChange,
  lens,
  onLensChange,
  rotatable = false,
  aside,
  lensSlot,
  slot = "viewer-inspect",
  onClose,
}: InspectFrameProps) {
  const [zoom, setZoom] = React.useState(ZOOM_MIN)
  const [pan, setPan] = React.useState({ x: 0, y: 0 })
  const drag = React.useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const onCloseRef = React.useRef(onClose)
  React.useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  const cls = viewTuneClass(tune)
  const labels = viewTuneLabels(tune)

  const zoomTo = (next: number) => {
    const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next))
    setZoom(z)
    if (z === ZOOM_MIN) setPan({ x: 0, y: 0 })
  }
  const fit = () => {
    setZoom(ZOOM_MIN)
    setPan({ x: 0, y: 0 })
  }

  // 열면 닫기 단추로 초점, 닫히면 연 자리로. Esc 는 먼저 받아 사건 창이 닫히지 않게 한다(capture + preventDefault).
  // 모달이므로 Tab 은 이 판 안에서만 돌고(초점 가두기), 같은 칸의 가려진 형제는 inert 로 잠근다(2회차 검수 — Tab 으로 뒤 조작부에 들어가던 것)
  React.useEffect(() => {
    const root = rootRef.current
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus({ preventScroll: true })
    const siblings = root?.parentElement ? Array.from(root.parentElement.children).filter((el) => el !== root && !el.hasAttribute("inert")) : []
    for (const el of siblings) el.setAttribute("inert", "")
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" && root) {
        const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute("disabled"))
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        const at = document.activeElement
        if (e.shiftKey ? at === first || !root.contains(at) : at === last || !root.contains(at)) {
          e.preventDefault()
          ;(e.shiftKey ? last : first).focus()
        }
        return
      }
      if (e.key !== "Escape") return
      e.preventDefault()
      e.stopPropagation()
      onCloseRef.current()
    }
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("keydown", onKey, true)
      for (const el of siblings) el.removeAttribute("inert")
      if (opener && opener.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  // 휠 = 확대(Shift + 휠은 확대경 지름 — LensBox 가 받는다)
  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.shiftKey) return
      e.preventDefault()
      setZoom((z) => {
        const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)))
        if (next === ZOOM_MIN) setPan({ x: 0, y: 0 })
        return next
      })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`이미지 ${title}`}
      data-theme="dark"
      data-slot={slot}
      className="absolute inset-0 z-[6] flex min-h-0 flex-col overflow-hidden rounded-[12px] border border-solid border-border bg-canvas text-foreground [box-shadow:0_12px_32px_var(--t-panel-drop)]"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-x-[10px] gap-y-[4px] border-0 border-b border-solid border-border bg-panel px-[12px] py-[6px]">
        <b className="inline-flex items-center gap-[7px] text-[12.5px] font-bold">
          <Eye aria-hidden="true" className="size-[15px] text-brand" strokeWidth={1.9} />
          {title}
        </b>
        {meta}
        <WorkbenchButton ref={closeRef} variant="ghost" icon={X} className="ml-auto" onClick={onClose} aria-label={`${title} 닫기`} title="닫기(Esc)">
          닫기
        </WorkbenchButton>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-x-[12px] gap-y-[4px] border-0 border-b border-solid border-border bg-panel px-[12px] py-[5px]">
        <ViewControls tune={tune} onTuneChange={onTuneChange} lens={lens} onLensChange={onLensChange} full rotatable={rotatable} />
        <span aria-hidden="true" className="h-[16px] w-px bg-line-3" />
        <span role="group" aria-label="확대" className="inline-flex items-center gap-[2px]">
          <span className="mr-[3px] text-[10.5px] font-semibold text-muted-foreground">확대</span>
          <WorkbenchButton size="sm" variant="ghost" icon={Minus} iconOnly aria-label="축소" disabled={zoom === ZOOM_MIN} onClick={() => zoomTo(zoom - ZOOM_STEP)} />
          <span className="min-w-[38px] text-center font-code text-[11px] tabular-nums text-fg-2">{zoom}%</span>
          <WorkbenchButton size="sm" variant="ghost" icon={Plus} iconOnly aria-label="확대" disabled={zoom === ZOOM_MAX} onClick={() => zoomTo(zoom + ZOOM_STEP)} />
          <WorkbenchButton size="sm" variant="ghost" icon={Maximize2} onClick={fit} disabled={zoom === ZOOM_MIN && pan.x === 0 && pan.y === 0}>
            맞춤
          </WorkbenchButton>
        </span>
      </div>
      <div className={cn("grid min-h-0 flex-1", aside ? "grid-cols-[minmax(0,1fr)_300px] @max-[760px]:grid-cols-[minmax(0,1fr)_252px]" : "grid-cols-1")}>
        <div
          ref={stageRef}
          role="img"
          aria-label={`${sourceLabel} 크게 보기 ${zoom}%${labels.length ? ` · ${labels.join(" · ")}` : ""}`}
          onPointerDown={(e) => {
            if (zoom === ZOOM_MIN || e.button !== 0) return
            e.currentTarget.setPointerCapture(e.pointerId)
            drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (d) setPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y })
          }}
          onPointerUp={() => {
            drag.current = null
          }}
          onDoubleClick={fit}
          className={cn("relative min-h-0 min-w-0 overflow-hidden bg-canvas", zoom > ZOOM_MIN && "cursor-grab active:cursor-grabbing")}
        >
          <div
            className="absolute"
            style={{
              width: `calc(${zoom}% - 32px)`,
              height: `calc(${zoom}% - 32px)`,
              left: `calc(${(100 - zoom) / 2}% + 16px + ${pan.x}px)`,
              top: `calc(${(100 - zoom) / 2}% + 16px + ${pan.y}px)`,
            }}
          >
            <LensBox
              enabled={lens.on}
              size={lens.size}
              zoom={lens.zoom}
              source={source}
              tune={cls}
              lensSlot={lensSlot}
              onSizeStep={(by) => onLensChange({ ...lens, size: stepLens(lens.size, by) })}
              className="size-full"
            >
              <div className={cn("size-full", cls.outer)}>
                <div className={cn("relative size-full", cls.inner)}>{source}</div>
              </div>
            </LensBox>
          </div>
          {labels.length ? (
            <span className="pointer-events-none absolute top-[10px] left-[12px] rounded-[5px] bg-panel/90 px-[7px] py-[2px] font-code text-[10.5px] text-fg-2">
              보기 · {labels.join(" · ")}
            </span>
          ) : null}
          <span className="pointer-events-none absolute right-[12px] bottom-[10px] text-[10.5px] text-muted-foreground">휠 확대 · 끌어서 이동 · 두 번 누르면 맞춤</span>
        </div>
        {aside ? <div className="flex min-h-0 min-w-0 flex-col border-0 border-l border-solid border-border bg-panel px-[12px] py-[10px]">{aside}</div> : null}
      </div>
    </div>
  )
}

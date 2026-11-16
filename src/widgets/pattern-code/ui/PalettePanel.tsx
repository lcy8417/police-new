import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Field, Segmented } from "@/shared/ui/kit"
import { PatternIcon } from "@/shared/ui/viewer"

import { DRAG_FORMAT, PALETTE_KINDS, PALETTE_SUB_TABS, patternName } from "../model/constants"
import type { PaletteKind } from "../model/types"
import { SubHead } from "./Band"

export interface PalettePanelProps {
  kind: PaletteKind
  onKindChange: (kind: PaletteKind) => void
  /** 고른 종류의 문양 그림 경로 */
  palette: readonly string[]
  /** 고른 부위에 이미 들어간 문양 이름(비활성 표시) */
  inserted: ReadonlySet<string>
  onInsert: (src: string) => void
  canEdit: boolean
  /** 시안 r2 덧붙임(이름 찾기 · 최근 사용 · 하위 탭)을 그릴까 */
  plus: boolean
  /** 「최근 사용」 그림 경로 */
  recent?: readonly string[]
  onPlusAction?: (label: string) => void
  /** 사건 창 안 — 테두리 상자 대신 작은 소제목 + 간격으로 묶음 */
  bare?: boolean
}

/** 팔레트 문양 한 칸(누르면 넣기 · 끌기, 이미 넣은 문양은 비활성) */
function PaletteItem({
  src,
  done,
  canEdit,
  onInsert,
  size,
}: {
  src: string
  done: boolean
  canEdit: boolean
  onInsert: (src: string) => void
  size?: "sm"
}) {
  const name = patternName(src)
  return (
    <button
      type="button"
      aria-label={`${name} 넣기`}
      title={done ? `${name} · 이미 넣음` : name}
      disabled={!canEdit || done}
      draggable={canEdit && !done}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_FORMAT, src)
        e.dataTransfer.effectAllowed = "copy"
      }}
      onClick={() => onInsert(src)}
      className={cn("cursor-grab rounded-[7px] border-0 bg-transparent p-0 disabled:cursor-not-allowed", done && "opacity-40")}
    >
      <PatternIcon name={name} src={src} size={size} />
    </button>
  )
}

/**
 * 문양 팔레트(SCAS 8탭 유지 — 시안 핀 10). 종류 버튼은 글자만 담는다(지금 앱이 `textContent`로 종류를 읽는다).
 * 문양을 누르면 고른 부위에 넣고, 끌어서 다른 부위 행에 놓을 수도 있다. 이미 넣은 문양은 비활성(지금 앱 `PatternPalette`와 같음).
 * 신규 켜기면 시안 덧붙임 — 이름 찾기(화면 안 거르기, 저장 안 함) · 최근 사용 줄 · 하위 탭.
 */
export function PalettePanel({ kind, onKindChange, palette, inserted, onInsert, canEdit, plus, recent, onPlusAction, bare = false }: PalettePanelProps) {
  const [query, setQuery] = React.useState("")
  const [subTab, setSubTab] = React.useState<string>(PALETTE_SUB_TABS[0])
  const q = plus ? query.trim().toLowerCase() : ""
  const shown = q ? palette.filter((src) => patternName(src).toLowerCase().includes(q)) : palette

  const kinds = (
    <Segmented
      aria-label="문양 종류"
      items={PALETTE_KINDS.map((k) => ({ value: k, label: k }))}
      value={kind}
      onValueChange={(v) => onKindChange(v as PaletteKind)}
      className="flex-wrap self-start [&_button]:px-[9px] [&_button]:py-[4px]"
    />
  )

  return (
    <div className={cn("flex flex-col gap-[8px]", !bare && "rounded-[10px] border border-solid border-border bg-panel-2 p-[10px]")}>
      {bare ? <SubHead title="문양 팔레트" /> : null}
      {plus ? (
        <div className="flex flex-wrap items-center gap-[8px]">
          {kinds}
          <span data-plus="" className="flex min-w-[140px] flex-1">
            <Field
              aria-label="문양 찾기"
              placeholder="⌕ 이름·설명 찾기"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-[11.5px]"
            />
          </span>
        </div>
      ) : (
        kinds
      )}
      {plus && recent && recent.length > 0 ? (
        <div data-plus="" role="group" aria-label="최근 사용" className="flex flex-wrap items-center gap-[5px]">
          <span className="mr-[2px] text-[11px] text-dim">최근 사용</span>
          {recent.map((src) => (
            <PaletteItem key={src} src={src} size="sm" done={inserted.has(patternName(src))} canEdit={canEdit} onInsert={onInsert} />
          ))}
        </div>
      ) : null}
      <div role="group" aria-label="문양 팔레트" className="flex flex-wrap gap-[5px] border-t border-solid border-line-2 pt-[8px]">
        {shown.map((src) => (
          <PaletteItem key={src} src={src} done={inserted.has(patternName(src))} canEdit={canEdit} onInsert={onInsert} />
        ))}
        {shown.length === 0 ? <span className="text-[11px] text-dim">「{query}」 이름의 문양이 없습니다.</span> : null}
      </div>
      {plus ? (
        <span data-plus="" className="self-start">
          <Segmented
            aria-label="하위 탭"
            items={PALETTE_SUB_TABS.map((t) => ({ value: t, label: t }))}
            value={subTab}
            onValueChange={(v) => {
              setSubTab(v)
              onPlusAction?.(`하위 탭 ${v}`)
            }}
            className="[&_button]:px-[10px] [&_button]:py-[3px]"
          />
        </span>
      ) : null}
    </div>
  )
}

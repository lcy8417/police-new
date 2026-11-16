import { cn } from "@/shared/lib/utils"
import { Segmented } from "@/shared/ui/kit"
import { PatternIcon } from "@/shared/ui/viewer"

import { DRAG_FORMAT, PALETTE_KINDS, patternName } from "../model/constants"
import type { PaletteKind } from "../model/types"

export interface PalettePanelProps {
  kind: PaletteKind
  onKindChange: (kind: PaletteKind) => void
  /** 고른 종류의 문양 그림 경로 */
  palette: readonly string[]
  /** 고른 부위에 이미 들어간 문양 이름(비활성 표시) */
  inserted: ReadonlySet<string>
  onInsert: (src: string) => void
  canEdit: boolean
}

/**
 * 문양 팔레트(SCAS 8탭 유지 — 시안 핀 10). 종류 버튼은 글자만 담는다(지금 앱이 `textContent`로 종류를 읽는다).
 * 문양을 누르면 고른 부위에 넣고, 끌어서 다른 부위 행에 놓을 수도 있다. 이미 넣은 문양은 비활성(지금 앱 `PatternPalette`와 같음).
 */
export function PalettePanel({ kind, onKindChange, palette, inserted, onInsert, canEdit }: PalettePanelProps) {
  return (
    <div className="flex flex-col gap-[8px] rounded-[10px] border border-solid border-border bg-panel-2 p-[10px]">
      <Segmented
        aria-label="문양 종류"
        items={PALETTE_KINDS.map((k) => ({ value: k, label: k }))}
        value={kind}
        onValueChange={(v) => onKindChange(v as PaletteKind)}
        className="flex-wrap self-start [&_button]:px-[9px] [&_button]:py-[4px]"
      />
      <div role="group" aria-label="문양 팔레트" className="flex flex-wrap gap-[5px] border-t border-solid border-line-2 pt-[8px]">
        {palette.map((src) => {
          const name = patternName(src)
          const done = inserted.has(name)
          return (
            <button
              key={src}
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
              <PatternIcon name={name} src={src} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

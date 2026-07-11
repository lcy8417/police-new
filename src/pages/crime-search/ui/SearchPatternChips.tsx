import { Info, Tags } from "lucide-react"

/** 부위 키 → 한국어 짧은 라벨. `filteredPatterns`의 키 순서와 일치. */
const ZONE_LABELS: { key: "top" | "mid" | "bottom" | "outline"; label: string }[] = [
  { key: "top", label: "상" },
  { key: "mid", label: "중" },
  { key: "bottom", label: "하" },
  { key: "outline", label: "윤곽" },
]

export interface SearchPatternChipsProps {
  /** `filteredPatterns` 결과 — 부위별 필수 문양 이름 배열. */
  patterns: Partial<Record<"top" | "mid" | "bottom" | "outline", string[]>>
}

/**
 * 현재 검색에 쓰인 필수 문양을 부위별 칩으로 요약한다. 하나도 없으면
 * "필수 문양 없음 — 전체로 검색" 안내를 띄운다(빈 채로도 검색은 진행된다).
 */
export function SearchPatternChips({ patterns }: SearchPatternChipsProps) {
  const groups = ZONE_LABELS.map(({ key, label }) => ({
    label,
    names: patterns[key] ?? [],
  })).filter((g) => g.names.length > 0)

  if (groups.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#1E2A3C] bg-[#0D1420]/60 px-4 py-2.5 text-[13px] text-[#8A93A6]">
        <Info className="size-4 shrink-0 text-[#4A9EFF]" aria-hidden="true" />
        <span>필수 문양 없음 — 전체로 검색 중입니다. 문양 정보에서 필수를 켜면 결과가 좁혀집니다.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#1E2A3C] bg-[#0D1420]/60 px-4 py-2.5">
      <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-[#5B6B85] uppercase">
        <Tags className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
        검색 문양
      </span>
      {groups.map(({ label, names }) => (
        <span
          key={label}
          className="flex items-center gap-1.5 rounded-lg border border-[#1E2A3C] bg-[#0F1826] px-2.5 py-1"
        >
          <span className="font-mono text-[10px] font-semibold text-[#4A9EFF]">{label}</span>
          <span className="text-[12px] text-[#C7CEDB]">{names.join(", ")}</span>
        </span>
      ))}
    </div>
  )
}

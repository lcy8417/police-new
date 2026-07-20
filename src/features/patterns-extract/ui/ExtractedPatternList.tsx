import { useMemo, useState, type DragEvent } from "react";
import { ArrowDownWideNarrow, ArrowRight, GripVertical, Sparkles } from "lucide-react";

import { insertPatternPath } from "@/entities/pattern";
import { TechCorners } from "@/shared/ui/tech-corners";
import { cn } from "@/shared/lib/utils";

/** 현장 단일 DINOv2 통합 추출 결과 1건 (REQ-SCENE-002/009). */
export interface ExtractedPatternItem {
  code: string;
  score: number;
}

interface ExtractedPatternListProps {
  /** 통합 추출 원본(REQ-SCENE-006) — currentCrimeData.extractedRaw. */
  items: ExtractedPatternItem[];
  /** 이미 상/중/하 중 하나에 삽입된 문양 이름 집합 — 비활성 표시에 사용(선택). */
  isInserted?: (code: string) => boolean;
  /** view(조회) 모드: 드래그를 비활성화한다. */
  readOnly?: boolean;
}

/**
 * "통합 추출란" — 현장 단일 DINOv2 추출 결과를 하나의 목록으로 렌더링하고
 * 상/중/하 드래그 소스로 제공한다(REQ-SCENE-006, D2). 기존 팔레트(PatternPalette)를
 * 대체해 이 컴포넌트가 크라임 통합 추출 결과의 유일한 DnD 소스가 된다.
 * score(신뢰도) 기준 정렬은 항상 내림차순이며, 최소 점수 필터를 제공한다
 * (REQ-SCENE-009: UI가 score 기준 정렬/필터 가능해야 한다).
 */
export function ExtractedPatternList({
  items,
  isInserted = () => false,
  readOnly = false,
}: ExtractedPatternListProps) {
  const [minScore, setMinScore] = useState(0);

  const sorted = useMemo(
    () =>
      [...items]
        .filter((item) => item.score >= minScore)
        .sort((a, b) => b.score - a.score),
    [items, minScore]
  );

  return (
    <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={20} />

      <div className="flex shrink-0 items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-2.5">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
          <Sparkles className="size-4 text-[#2DD4BF]" aria-hidden="true" />
          통합 추출란
        </span>
        <span className="flex items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-[#2DD4BF] uppercase">
          <span
            className="size-1.5 rounded-full bg-[#2DD4BF] shadow-[0_0_5px_rgba(45,212,191,0.7)]"
            aria-hidden="true"
          />
          Source
        </span>
      </div>

      {/* 필터/정렬 컨트롤 — score 내림차순 고정 정렬 + 최소 점수 필터(REQ-SCENE-009) */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#141D2C] bg-[#0D1420]/40 px-4 py-2">
        <ArrowDownWideNarrow className="size-3.5 shrink-0 text-[#2DD4BF]/80" aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-wide text-[#5FE0D0]">score 내림차순</span>
        <label className="ml-auto flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-[#8A93A6]">
          최소 점수
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value) || 0)}
            className="w-14 rounded border border-[#1E2A3C] bg-[#0F1826] px-1.5 py-0.5 text-[#C7CEDB] outline-none focus:border-[#2DD4BF]/60"
            aria-label="최소 점수 필터"
          />
        </label>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-b border-[#141D2C] bg-[#0F2624]/30 px-4 py-1.5">
        <GripVertical className="size-3 shrink-0 text-[#2DD4BF]/80" aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-wide text-[#5FE0D0]">
          {readOnly ? "조회 전용" : "드래그"}
        </span>
        <ArrowRight className="size-3 shrink-0 text-[#2DD4BF]" aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-wide text-[#5B6B85]">
          {readOnly ? "" : "상/중/하 존으로 배치"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-8 text-[#5B6B85]">
          <span className="text-[11px] font-medium">추출 결과가 없습니다</span>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-4 gap-2.5 overflow-y-auto p-4 sm:grid-cols-5 lg:grid-cols-6">
          {sorted.map((item) => {
            const src = insertPatternPath(item.code) as string;
            const inserted = isInserted(item.code);
            return (
              <button
                key={item.code}
                type="button"
                disabled={inserted || readOnly}
                draggable={!inserted && !readOnly}
                onDragStart={(e: DragEvent<HTMLButtonElement>) => {
                  if (readOnly) return;
                  e.dataTransfer.setData("text/plain", src);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-lg border bg-[#05080D] transition-all duration-150",
                  inserted
                    ? "cursor-not-allowed border-[#22C55E]/40 opacity-40"
                    : readOnly
                      ? "cursor-default border-[#1E2A3C] opacity-60"
                      : "cursor-grab border-[#1E2A3C] hover:-translate-y-1 hover:border-[#2DD4BF]/60 hover:shadow-[0_10px_22px_rgba(45,212,191,0.28)] active:cursor-grabbing active:translate-y-0"
                )}
              >
                <div className="relative aspect-square w-full">
                  <img
                    src={src}
                    alt={`${item.code} 문양`}
                    className="absolute inset-0 size-full object-contain p-1.5"
                  />
                </div>
                <span className="border-t border-[#141D2C] bg-[#0D1420]/80 px-1 py-0.5 text-center font-mono text-[9px] tabular-nums text-[#8A93A6]">
                  {item.code} · {item.score.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

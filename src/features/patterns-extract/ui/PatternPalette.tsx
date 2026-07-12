import { useState, type DragEvent, type MouseEvent } from "react";
import { ArrowRight, Check, Database, GripVertical } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { TechCorners } from "@/shared/ui/tech-corners";

/**
 * 문양 종류 버튼 라벨. `patternsKindSelect`가 `e.target.textContent`로 종류를 읽어
 * `getPatternsPath[kind]`를 조회하므로, 이 라벨은 레거시 `PatternList`와 정확히
 * 일치해야 하고 버튼은 텍스트만 담아야 한다(아이콘을 넣으면 target이 svg가 되어
 * textContent가 비게 됨).
 */
const KINDS = ["무늬", "선", "윤곽", "다각", "삼각", "사각", "원", "항목"];

interface PatternPaletteProps {
  /** 현재 선택된 종류의 문양 경로 목록(usePatternManager.patterns). */
  patterns: string[];
  patternsKindSelect: (e: MouseEvent<HTMLButtonElement>) => void;
  insertPattern: (e: MouseEvent<HTMLImageElement>) => void;
  /**
   * 현재 선택된 부위에 이미 삽입된 문양인지 이름 기준으로 판정한다. 삽입된
   * 문양은 비활성화(클릭 불가·흐림·체크 뱃지)된다. 기본값은 항상 false.
   */
  isInserted?: (src: string) => boolean;
  /** view(조회) 모드: 삽입·드래그를 비활성화한다(라이브러리 열람만 가능). */
  readOnly?: boolean;
}

/**
 * 문양 리스트/팔레트(다크 커맨드센터 톤). 레거시 `PatternList`를 대체하는 패턴추출
 * 전용 신규 컴포넌트다(레거시 `PatternList`는 이제 `PartialPatterns`만 쓰므로 존치).
 * 종류 버튼으로 도형 폴더를 전환하고, 썸네일 클릭 시 `insertPattern`이 현재 선택된
 * 부위에 문양을 추가한다(`e.target.src`를 읽음).
 */
export function PatternPalette({
  patterns,
  patternsKindSelect,
  insertPattern,
  isInserted = () => false,
  readOnly = false,
}: PatternPaletteProps) {
  // 표시 전용 — 어느 종류 버튼이 활성인지 로컬로 추적한다(usePatternManager는
  // 이 상태를 소유하지 않으므로 계약을 바꾸지 않는다). 마운트 시 훅이 "무늬"를
  // 기본 로드하므로 초깃값을 맞춘다.
  const [activeKind, setActiveKind] = useState<string>(KINDS[0]);

  return (
    <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={20} />

      <div className="flex shrink-0 items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-2.5">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
          <Database className="size-4 text-[#2DD4BF]" aria-hidden="true" />
          문양 리스트
        </span>
        {/* 소스(집어드는 곳) 배지 — 문양 정보 패널의 "Target" 배지와 대비되는 역할 표식 */}
        <span className="flex items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-[#2DD4BF] uppercase">
          <span
            className="size-1.5 rounded-full bg-[#2DD4BF] shadow-[0_0_5px_rgba(45,212,191,0.7)]"
            aria-hidden="true"
          />
          Source
        </span>
      </div>

      {/* 종류 선택 버튼(텍스트 전용 — textContent 규약 유지) */}
      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-[#141D2C] bg-[#0D1420]/40 px-4 py-2.5">
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={(e) => {
              setActiveKind(kind);
              patternsKindSelect(e);
            }}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              activeKind === kind
                ? "border-[#2DD4BF]/50 bg-[#123330] text-[#2DD4BF]"
                : "border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#2DD4BF]/50 hover:bg-[#123330] hover:text-[#2DD4BF]"
            )}
          >
            {kind}
          </button>
        ))}
      </div>

      {/* 삽입 안내 — "리스트 → 정보" 방향성을 아이콘으로 드러낸다(잡기 → 이동). */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-[#141D2C] bg-[#0F2624]/30 px-4 py-1.5">
        <GripVertical className="size-3 shrink-0 text-[#2DD4BF]/80" aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-wide text-[#5FE0D0]">
          {readOnly ? "라이브러리" : "클릭 또는 드래그"}
        </span>
        <ArrowRight className="size-3 shrink-0 text-[#2DD4BF]" aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-wide text-[#5B6B85]">
          {readOnly ? "조회 모드 · 편집 시 삽입 가능" : "문양 정보에서 선택한 부위로 삽입"}
        </span>
      </div>

      {/* 문양 썸네일 그리드 */}
      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-4 gap-2.5 overflow-y-auto p-4 sm:grid-cols-5 lg:grid-cols-6">
        {patterns.map((src, index) => {
          const inserted = isInserted(src);
          return (
            <button
              key={index}
              type="button"
              disabled={inserted || readOnly}
              // 드래그 시작 시 문양 경로를 dataTransfer에 실어 문양 정보 존이
              // 드롭으로 받을 수 있게 한다. 이미 삽입된 문양·조회 모드는 드래그 불가.
              draggable={!inserted && !readOnly}
              onDragStart={(e: DragEvent<HTMLButtonElement>) => {
                if (readOnly) return;
                e.dataTransfer.setData("text/plain", src);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-[#05080D] transition-all duration-150",
                inserted
                  ? "cursor-not-allowed border-[#22C55E]/40 opacity-40"
                  : readOnly
                    ? "cursor-default border-[#1E2A3C] opacity-60"
                    : "cursor-grab border-[#1E2A3C] hover:-translate-y-1 hover:border-[#2DD4BF]/60 hover:shadow-[0_10px_22px_rgba(45,212,191,0.28)] active:cursor-grabbing active:translate-y-0"
              )}
            >
              <img
                src={src}
                alt={`문양 ${index + 1}`}
                onClick={inserted || readOnly ? undefined : insertPattern}
                className={cn(
                  "absolute inset-0 size-full object-contain p-1.5 transition-transform",
                  inserted || readOnly
                    ? "pointer-events-none"
                    : "cursor-pointer group-hover:scale-105"
                )}
              />
              {/* 드래그 핸들 어포던스(점자 그립) — 호버 시에만 노출해 "잡을 수 있음"을 알린다. */}
              {!inserted && !readOnly && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1 left-1 z-10 flex size-4 items-center justify-center rounded border border-[#2DD4BF]/40 bg-[#0B121D]/80 text-[#2DD4BF] opacity-0 shadow-[0_0_6px_rgba(45,212,191,0.4)] transition-opacity duration-150 group-hover:opacity-100"
                >
                  <GripVertical className="size-2.5" />
                </span>
              )}
              {inserted && (
                <span
                  aria-label="삽입됨"
                  className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full border border-[#22C55E]/50 bg-[#0B121D]/80 text-[#4ADE80] shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                >
                  <Check className="size-2.5" aria-hidden="true" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

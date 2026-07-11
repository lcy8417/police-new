import { useState, type DragEvent } from "react";
import { Crosshair, ImageOff, Target, Trash2 } from "lucide-react";

import type { Crime } from "@/entities/crime";
import type { PatternEntry, PatternZone } from "@/entities/pattern";
import { TechCorners } from "@/shared/ui/tech-corners";
import { cn } from "@/shared/lib/utils";

/** 한국어 부위 라벨 ↔ 데이터 키. 레거시 PatternInfo/PatternItem의 매핑을 유지한다. */
const ZONES: { label: string; key: PatternZone }[] = [
  { label: "상", key: "top" },
  { label: "중", key: "mid" },
  { label: "하", key: "bottom" },
  { label: "윤곽", key: "outline" },
];

interface PatternZonesProps {
  /** 선택된 부위 인덱스(0~3). 팔레트에서 삽입 시 대상 부위를 정한다. */
  selected: number | null;
  setSelected: (index: number) => void;
  deletePattern: (kind: PatternZone, src: string) => void;
  essentialCheck: (kind: PatternZone, src: string) => void;
  /** 현재 사건 데이터(store 파생). 각 부위의 문양 튜플 배열을 읽는다. */
  currentData: Crime | null | undefined;
  /** 문양 리스트에서 드래그한 문양을 해당 부위로 삽입한다(현재 선택과 무관). */
  onDropToZone?: (kind: PatternZone, src: string) => void;
}

/** 범죄 패턴 튜플 `[경로, 필수플래그]` / 신발 문자열 어느 표현이든 [경로, 필수]로 정규화. */
function normalize(item: PatternEntry): [string, boolean] {
  return typeof item === "string" ? [item, false] : [item[0], Boolean(item[1])];
}

/**
 * 문양 정보 패널(다크 커맨드센터 톤). 레거시 `PatternInfo`+`PatternItem`을 대체하는
 * 패턴추출 전용 신규 컴포넌트다(레거시 3종은 ShoesRegisterMain이 여전히 쓰므로 존치).
 * 상/중/하/윤곽 4개 부위를 표시하며, 부위 헤더를 클릭하면 삽입 대상으로 선택되고,
 * 썸네일 클릭은 삭제, 우클릭은 "필수" 토글이다(레거시 상호작용 규약 보존).
 */
export function PatternZones({
  selected,
  setSelected,
  deletePattern,
  essentialCheck,
  currentData,
  onDropToZone,
}: PatternZonesProps) {
  // 드래그 오버 중인 부위 — 시각 피드백(하이라이트)에만 쓰는 표시 전용 상태.
  const [dragOverKey, setDragOverKey] = useState<PatternZone | null>(null);

  const handleDrop = (kind: PatternZone) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverKey(null);
    const src = e.dataTransfer.getData("text/plain");
    if (src) onDropToZone?.(kind, src);
  };

  return (
    <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={20} active={selected !== null} />

      <div className="flex shrink-0 items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-2.5">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
          <Target className="size-4 text-[#4A9EFF]" aria-hidden="true" />
          문양 정보
        </span>
        <div className="hidden items-center gap-2.5 sm:flex">
          {/* 타깃(모으는 곳) 배지 — 문양 리스트 패널의 "Source" 배지와 대비되는 역할 표식 */}
          <span className="flex items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-[#4A9EFF] uppercase">
            <span
              className="size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_5px_rgba(74,158,255,0.7)]"
              aria-hidden="true"
            />
            Target
          </span>
          <span className="font-mono text-[10px] tracking-wide text-[#5B6B85]">
            클릭 삭제 · 우클릭 필수
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase">
            <span
              className="size-1.5 rounded-full bg-[#EF4444] shadow-[0_0_5px_rgba(239,68,68,0.7)]"
              aria-hidden="true"
            />
            필수
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2.5 p-3">
        {ZONES.map(({ label, key }, index) => {
          const isSelected = selected === index;
          const isDragOver = dragOverKey === key;
          const patterns = currentData?.[key] ?? [];
          return (
            <div
              key={key}
              // 각 부위를 드롭 타깃으로 만든다. onDragOver의 preventDefault가
              // 있어야 onDrop이 발생한다.
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                if (dragOverKey !== key) setDragOverKey(key);
              }}
              onDragLeave={() => {
                if (dragOverKey === key) setDragOverKey(null);
              }}
              onDrop={handleDrop(key)}
              className={cn(
                // 문양이 없는 부위는 점선 "빈 슬롯"으로 보이게 해 드롭 타깃임을 형태로 암시한다.
                "relative flex min-h-0 flex-col overflow-hidden rounded-xl border bg-[#0F1826] transition-colors",
                isDragOver
                  ? "border-[#4A9EFF] shadow-[0_0_18px_rgba(74,158,255,0.35)] ring-2 ring-[#4A9EFF]/70"
                  : isSelected
                    ? "border-[#3B82F6]/60 shadow-[0_0_16px_rgba(37,99,235,0.2)]"
                    : patterns.length === 0
                      ? "border-dashed border-[#2A3A52]"
                      : "border-[#1E2A3C]"
              )}
            >
              {/* 드래그 중 대상 부위임을 또렷이 알리는 오버레이 — "여기에 놓기" */}
              {isDragOver && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#0B121D]/85 backdrop-blur-[1px]">
                  <span className="flex items-center gap-1.5 rounded-md border border-[#4A9EFF]/60 bg-[#152238] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-[#4A9EFF] shadow-[0_0_14px_rgba(74,158,255,0.5)]">
                    <Target className="size-3" aria-hidden="true" />
                    여기에 놓기
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelected(index)}
                className={cn(
                  "flex shrink-0 items-center justify-between border-b px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                  isSelected
                    ? "border-[#141D2C] bg-[#152238] text-[#4A9EFF]"
                    : "border-[#141D2C] bg-[#0D1420]/60 text-[#C7CEDB] hover:text-white"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span>{label}</span>
                  {isSelected && (
                    <span className="flex items-center gap-1 rounded border border-[#3B82F6]/40 bg-[#0B121D]/60 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-[#4A9EFF] uppercase">
                      <Crosshair className="size-2.5" aria-hidden="true" />
                      대상
                    </span>
                  )}
                </span>
                <span className="min-w-[20px] rounded-full border border-[#3B82F6]/40 bg-[#152238]/70 px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold tabular-nums text-[#4A9EFF]">
                  {patterns.length}
                </span>
              </button>

              {patterns.length > 0 ? (
                <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-3 gap-2 overflow-y-auto p-2.5">
                  {patterns.map((item, i) => {
                    const [path, essential] = normalize(item);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "group relative aspect-square overflow-hidden rounded-lg bg-[#05080D] transition-all",
                          essential
                            ? "border-2 border-[#EF4444] shadow-[0_0_14px_rgba(239,68,68,0.5)] ring-1 ring-[#EF4444]/60"
                            : "border border-[#1E2A3C] hover:border-[#3B82F6]/40"
                        )}
                      >
                        <img
                          src={path}
                          alt={`${label} 문양 ${i + 1}`}
                          title="클릭: 삭제 · 우클릭: 필수 토글"
                          onClick={() => deletePattern(key, path)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            essentialCheck(key, path);
                          }}
                          className="absolute inset-0 size-full cursor-pointer object-contain p-1.5 transition-transform group-hover:scale-105"
                        />
                        {essential && (
                          <span className="pointer-events-none absolute top-1 left-1 z-10 rounded border border-[#EF4444]/70 bg-[#EF4444] px-1 py-px font-mono text-[8px] font-bold tracking-wide text-white shadow-[0_0_8px_rgba(239,68,68,0.7)]">
                            필수
                          </span>
                        )}
                        {/* 삭제 어포던스(호버 전용) — 클릭 시 삭제됨을 시각적으로 예고한다. */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#05080D]/0 opacity-0 transition-all duration-150 group-hover:bg-[#05080D]/70 group-hover:opacity-100">
                          <Trash2 className="size-3.5 text-[#EF4444]" aria-hidden="true" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-[#5B6B85]">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-[#2A3A52]">
                    <ImageOff className="size-4" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-medium">여기로 드래그</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Crosshair, ImageOff, MousePointerClick, Wand2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { TechCorners } from "@/shared/ui/tech-corners";

import type { Point } from "../lib/polygon-geometry";
import type { EditTool } from "../model/use-image-edit";
import { EditLoadingOverlay } from "./EditLoadingOverlay";
import { PolygonOverlay } from "./PolygonOverlay";

/**
 * 현장 이미지 편집 뷰포트. 표시 이미지 위에 폴리곤 입력용 오버레이 canvas를 얹는다.
 * 상태는 소유하지 않고(EditWorkbench가 useImageEdit 훅을 호출해 props로 내려줌) 좌표 캡처와
 * 표시만 담당하는 프레젠테이션 컴포넌트다.
 *
 * ── 핵심 좌표 계약 (백엔드 크래시 방지 — @docs/api-communication.md §4) ──
 * PatternCanvas의 좌표 전략을 그대로 모방한다:
 *  1) 래퍼가 `w-fit`으로 표시 이미지(h-full·w-auto·object-contain)에 딱 붙고,
 *  2) 오버레이 canvas는 `absolute inset-0 size-full`로 그 래퍼(=표시 이미지)를 정확히 덮는다.
 * 따라서 `canvas.getBoundingClientRect()`가 곧 표시 이미지 rect다. 정점 캡처(onAddPoint)와
 * render_size(onSubmitPolygon) 모두 **이 동일한 rect**를 넘기므로 두 좌표계가 일치한다. 소수
 * rect라도 use-image-edit의 polygon-geometry가 정수화(Math.round)·clamp하므로 여기선 rect를
 * 있는 그대로 넘긴다.
 *
 * recompute는 canvas 비트맵을 표시 이미지 크기에 맞춰(1:1 정렬 유지) mount·resize·이미지 로드·
 * ResizeObserver(Sheet 안에서 0→정상 크기 전환, R5)마다 재측정한다.
 */
export interface EditCanvasProps {
  /** 표시 이미지(useImageEdit.displayImage — 이진화 라이브 프리뷰 포함). */
  displayImage: string;
  /** 현재 편집 툴. background/inpaint일 때만 폴리곤 입력을 활성화한다. */
  activeTool: EditTool | null;
  /** 수집된 폴리곤 정점(표시 rect 기준 정수 px). PolygonOverlay가 그린다. */
  points: Point[];
  /** 좌클릭 정점 추가 — 표시 이미지 rect를 넘겨 canvas-local 좌표로 변환하게 한다. */
  onAddPoint: (clientX: number, clientY: number, rect: DOMRect) => void;
  /** 우클릭/더블클릭 폴리곤 제출 — render_size 산정에 같은 표시 이미지 rect를 넘긴다. */
  onSubmitPolygon: (rect: DOMRect) => void;
  /** 서버 처리 진행 중 여부(로딩 오버레이). */
  isProcessing: boolean;
  /** 처리 중 오버레이 문구(툴별). */
  processingLabel: string;
}

export function EditCanvas({
  displayImage,
  activeTool,
  points,
  onAddPoint,
  onSubmitPolygon,
  isProcessing,
  processingLabel,
}: EditCanvasProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // canvas 비트맵 크기(표시 이미지 크기와 동기) + 원본 픽셀 치수(상태표시줄용).
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const isPolygonTool = activeTool === "background" || activeTool === "inpaint";
  const hasImage = Boolean(displayImage);

  // 오버레이 canvas 비트맵을 표시 이미지 rect에 맞춰 1:1 정렬한다(PatternCanvas.recompute 준용).
  const recompute = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    canvas.width = w;
    canvas.height = h;
    setCanvasSize({ w, h });
  }, []);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const el = e.currentTarget;
      setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
      recompute();
    },
    [recompute]
  );

  // mount·resize·이미지 변경마다 재측정. ResizeObserver로 Sheet 안에서 0→정상 크기 전환(R5) 대응.
  useEffect(() => {
    recompute();
    const img = imgRef.current;
    const ro = new ResizeObserver(() => recompute());
    if (img) ro.observe(img);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [recompute, displayImage]);

  // 좌클릭 → 정점 추가. 표시 이미지 rect(=canvas rect)를 넘겨 좌표계를 일치시킨다.
  // 더블클릭의 두 번째 클릭(detail>1)은 정점 추가를 건너뛴다(닫기와 중복 방지).
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isPolygonTool || e.detail > 1) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    onAddPoint(e.clientX, e.clientY, rect);
  };

  // 우클릭 → 폴리곤 닫고 제출. 기본 컨텍스트 메뉴는 항상 막되, 제출은 폴리곤 툴일 때만.
  const handleContextMenu = (e: MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isPolygonTool) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    onSubmitPolygon(rect);
  };

  // 더블클릭 → 폴리곤 제출(우클릭 대안).
  const handleDoubleClick = () => {
    if (!isPolygonTool) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    onSubmitPolygon(rect);
  };

  const pointCount = points.length;

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <TechCorners size={22} active={isProcessing} />

      {/* 헤더 — 타이틀 + 현재 폴리곤 툴 안내(활성 시). */}
      <div className="flex items-center justify-between gap-3 border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
          <Wand2 className="size-4 text-[#4A9EFF]" aria-hidden="true" />
          이미지 편집
        </span>
        {isPolygonTool && (
          <span className="flex items-center gap-1.5 rounded-full border border-[#3B82F6]/40 bg-[#152238] px-2.5 py-1 font-mono text-[10px] tracking-wide text-[#4A9EFF]">
            <MousePointerClick className="size-3" aria-hidden="true" />
            {activeTool === "background" ? "배경 영역 지정" : "복원 영역 지정"}
          </span>
        )}
      </div>

      {/* 뷰포트 — 표시 이미지 + 폴리곤 입력 오버레이. PatternCanvas와 같은 뷰포트 언어. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#05080D]/70 px-2 py-3">
        {/* 네 모서리 포인트 마커 — 순수 장식(pointer-events-none). */}
        {hasImage && (
          <>
            <span className="pointer-events-none absolute top-2 left-2 z-10 size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_2px_rgba(74,158,255,0.7)]" aria-hidden="true" />
            <span className="pointer-events-none absolute top-2 right-2 z-10 size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_2px_rgba(74,158,255,0.7)]" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-2 left-2 z-10 size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_2px_rgba(74,158,255,0.7)]" aria-hidden="true" />
            <span className="pointer-events-none absolute right-2 bottom-2 z-10 size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_2px_rgba(74,158,255,0.7)]" aria-hidden="true" />
            <Crosshair className="pointer-events-none absolute top-2.5 left-2 size-4 text-[#4A9EFF]/60 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
            <Crosshair className="pointer-events-none absolute right-2 bottom-2.5 size-4 text-[#4A9EFF]/60 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
          </>
        )}

        {hasImage ? (
          // 래퍼는 w-fit으로 표시 이미지에 딱 붙는다 → canvas(size-full)가 이미지를 정확히 덮어
          // getBoundingClientRect()가 곧 표시 이미지 rect가 된다(좌표 계약의 핵심).
          <div className="relative flex h-full w-fit max-w-full items-center justify-center">
            <img
              ref={imgRef}
              src={displayImage}
              alt="편집 대상 현장 이미지"
              draggable={false}
              onLoad={handleImageLoad}
              className="h-full w-auto max-w-full object-contain select-none"
            />

            {/* 폴리곤 입력 캡처 surface — 폴리곤 툴일 때만 이벤트를 받고 crosshair를 띄운다.
                그 외 툴(threshold/denoise)에서는 pointer-events-none으로 통과시킨다. */}
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onContextMenu={handleContextMenu}
              onDoubleClick={handleDoubleClick}
              className={cn(
                "absolute inset-0 size-full",
                isPolygonTool ? "cursor-crosshair" : "pointer-events-none"
              )}
            />

            {/* 폴리곤 시각화 — 순수 장식(pointer-events-none), canvas 위에 얹힌다. */}
            <PolygonOverlay points={points} activeTool={activeTool} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[#5B6B85]">
            <ImageOff className="size-9" aria-hidden="true" />
            <span className="text-sm font-medium">편집할 이미지가 없습니다</span>
          </div>
        )}

        {hasImage && (
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-wider text-[#5B6B85]">
            KCSI / Forensic Editing
          </span>
        )}

        {/* 서버 처리 로딩 오버레이 — 뷰포트 최상단, 인터랙션 흡수. */}
        <EditLoadingOverlay show={isProcessing} label={processingLabel} />
      </div>

      {/* 하단 상태표시줄 — 원본 치수 · 폴리곤 안내/정점 수. */}
      <div className="flex items-center gap-2 border-t border-[#141D2C] px-4 py-2">
        <span className="shrink-0 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-1 font-mono text-[10px] tabular-nums text-[#8A93A6]">
          {naturalSize.w}×{naturalSize.h}
        </span>
        <span className="hidden min-w-0 flex-1 items-center gap-1 truncate font-mono text-[10px] text-[#8A93A6] md:flex">
          <MousePointerClick className="size-3 shrink-0 text-[#4A9EFF]" aria-hidden="true" />
          <span className="truncate">
            {isPolygonTool
              ? "좌클릭으로 정점 추가 · 우클릭/더블클릭으로 영역 확정"
              : "배경분리 또는 복원 툴을 선택하면 영역을 지정할 수 있습니다"}
          </span>
        </span>
        <span className="ml-auto shrink-0 font-mono text-[11px] tracking-wide text-[#6B7688] uppercase">
          {isPolygonTool ? `${pointCount} Points` : `${canvasSize.w}×${canvasSize.h}`}
        </span>
      </div>
    </section>
  );
}

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import {
  Camera,
  Crosshair,
  Footprints,
  GripHorizontal,
  ImageOff,
  ImagePlus,
  Move,
  Radar,
  RotateCcw,
  ScanSearch,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { TechCorners } from "@/shared/ui/tech-corners";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { usePatternManager } from "../model/use-pattern-manager";
import {
  isNearAnyLine,
  moveLine,
  pickDraggableLine,
} from "../lib/line-geometry";

// usePatternManager의 반환 타입에서 계약을 그대로 파생한다(훅 무수정 재사용).
type PatternManager = ReturnType<typeof usePatternManager>;
type LineState = PatternManager["lineState"];
type SetLineState = PatternManager["setLineState"];

/** 이미지 스와퍼 세그먼트의 한국어 라벨(레거시 규약 유지). */
const VIEW_LABELS = ["현장이미지", "편집이미지"] as const;
type ViewLabel = (typeof VIEW_LABELS)[number];

/** 신발 영역(사각 마스크)의 canvas 픽셀 좌표. */
interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 영역 드래그 모드: 이동 또는 네 꼭짓점 리사이즈. */
type RegionHandle = "move" | "nw" | "ne" | "sw" | "se";

/** 영역 드래그 진행 상태 — 시작 시점의 마우스/영역 스냅샷을 담는다. */
interface RegionDrag {
  mode: RegionHandle;
  startX: number;
  startY: number;
  origin: Region;
}

/** 영역 최소 크기(canvas 픽셀). 이보다 작게 줄지 않도록 clamp한다. */
const REGION_MIN_SIZE = 40;

/** 값 v를 [min, max] 범위로 clamp한다. */
const clampValue = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

interface PatternCanvasProps {
  /** usePatternManager가 소유한 canvasRef — extractPattern이 여기서 render_size를 읽는다. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** 표시 이미지 element ref — 스와퍼가 src를 직접 바꾸고, extractPattern이 src를 읽는다. */
  imgRef: RefObject<HTMLImageElement | null>;
  /** 현장(원본) 이미지 경로. 참조가 안정적이어야 스와퍼의 명령형 src 변경이 유지된다. */
  image: string | null;
  /** 상/중/하 경계선 상태(usePatternManager 소유). */
  lineState: LineState;
  setLineState: SetLineState;
  onExtract: () => void;
  onClear: () => void;
  onShowOrigin: () => void;
  onShowEdit: () => void;
  isExtracting?: boolean;
}

/** 도크 툴바용 소형 버튼(crime-register EvidenceImagePanel 톤 준용). */
function ToolButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
  pending = false,
}: {
  icon: typeof Camera;
  label: string;
  onClick: () => void;
  variant?: "default" | "accent";
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "accent"
          ? "border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] hover:bg-[#182b45]"
          : "border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
      )}
    >
      <Icon className={cn("size-3.5", pending && "animate-spin")} aria-hidden="true" />
      {label}
    </button>
  );
}

/**
 * 패턴추출 전용 신규 FSD 캔버스. 레거시 `Canvas.jsx`(507줄) 중 패턴추출이 실제로
 * 쓰던 부분집합만 재현한다: (1) 현장/편집 이미지 표시, (2) 상/중/하 경계선(line) 편집
 * 상호작용, (3) 문양추출/초기화 트리거. 크롭·회전·줌·각도보정점·선택박스는 패턴추출이
 * 쓰지 않으므로 재현하지 않는다.
 *
 * 동작 보존: 오버레이 canvas의 비트맵 크기를 표시된 이미지 크기에 맞추고(정렬은
 * crime-register `useImageEditor`의 오버레이 전략과 동일), 선 좌표(lineYs)를 canvas
 * 픽셀 공간에 둔다. extractPattern은 `canvasRef.getBoundingClientRect()`를 render_size로,
 * `lineState.lineYs`를 line_ys로 보내므로 두 값의 좌표계가 일치해 서버로 가는 결과가
 * 레거시와 동일하다.
 *
 * 디자인 마감: 상/중/하 부위 라벨, 경계선 핸들 태그, 안내 배지, 체커보드
 * 눈금/모서리 십자선/하단 상태표시줄(crime-register `EvidenceImagePanel` · 검색결과
 * `CrimeScenePanel`과 같은 뷰포트 언어)은 모두 이 파일의 순수 프레젠테이션 레이어다 —
 * canvas 비트맵 정렬, `toCanvasY`/`pickDraggableLine`/`moveLine` 좌표 수학,
 * `extractPattern`이 읽는 `lineState.lineYs`/`render_size` 값은 손대지 않았다.
 */
export function PatternCanvas({
  canvasRef,
  imgRef,
  image,
  lineState,
  setLineState,
  onExtract,
  onClear,
  onShowOrigin,
  onShowEdit,
  isExtracting = false,
}: PatternCanvasProps) {
  // canvas 리사이즈 시 선을 다시 그리기 위한 트리거.
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  // 표시 전용 상태 — 어느 스와퍼 세그먼트가 활성인지, 원본 픽셀 치수는 얼마인지.
  // 캔버스 좌표 로직에는 관여하지 않는다.
  const [activeView, setActiveView] = useState<ViewLabel>("현장이미지");
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  // 신발 영역(사각 마스크) — canvas 픽셀 공간의 사각 박스. 순수 UI 제약이며
  // 추출로는 보내지 않는다(불변식: render_size/line_ys 전송 로직 무수정). null이면
  // 아직 초기화 전. mirrored=false는 왼쪽 신발("L"), true는 오른쪽 신발("R").
  const [region, setRegion] = useState<Region | null>(null);
  const [mirrored, setMirrored] = useState(false);
  // 비율 유지 재계산을 위한 직전 캔버스 크기 스냅샷.
  const prevCanvasRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  // 영역 드래그(이동/꼭짓점 리사이즈) 진행 상태 — window 리스너가 참조한다.
  const regionDragRef = useRef<RegionDrag | null>(null);

  // 표시된 이미지에 맞춰 canvas 비트맵 크기를 재측정한다. 마우스/canvas 좌표가
  // 1:1로 대응하도록 비트맵 크기를 표시 크기에 맞춘다(useImageEditor.recomputeOverlay 준용).
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
  }, [imgRef, canvasRef]);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const el = e.currentTarget;
      setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
      recompute();
    },
    [recompute]
  );

  // 반응형 리사이즈 동안 정렬을 유지한다.
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
  }, [recompute, imgRef, image]);

  // 신발 영역 초기화/재계산. 캔버스 크기가 정해지면(w,h>0) 영역이 없을 때 왼쪽
  // 신발 기준(좌측에 치우친 박스)으로 한 번 초기화하고, 리사이즈 시에는 직전 캔버스
  // 대비 비율을 유지해 간단히 스케일한 뒤 캔버스 안으로 clamp한다.
  useEffect(() => {
    const { w, h } = canvasSize;
    if (w <= 0 || h <= 0) return;
    const prev = prevCanvasRef.current;
    setRegion((current) => {
      let next: Region;
      if (current && prev.w > 0 && prev.h > 0) {
        const sx = w / prev.w;
        const sy = h / prev.h;
        next = {
          x: current.x * sx,
          y: current.y * sy,
          w: current.w * sx,
          h: current.h * sy,
        };
      } else {
        // 왼쪽 신발 기준 기본 박스(좌측 치우침).
        next = { x: w * 0.08, y: h * 0.05, w: w * 0.6, h: h * 0.9 };
      }
      // 최소 크기 보장 후 캔버스 안으로 clamp.
      const nw = clampValue(next.w, REGION_MIN_SIZE, w);
      const nh = clampValue(next.h, REGION_MIN_SIZE, h);
      const nx = clampValue(next.x, 0, w - nw);
      const ny = clampValue(next.y, 0, h - nh);
      return { x: nx, y: ny, w: nw, h: nh };
    });
    prevCanvasRef.current = { w, h };
    // 캔버스 크기 "값"이 바뀔 때만 재계산한다(객체 정체성 대신 w/h 원시값 의존 —
    // ResizeObserver의 잦은 setState로 인한 불필요한 재실행/영역 churn 방지).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.w, canvasSize.h]);

  // 영역이 바뀌면 경계선(lineYs)을 영역 세로 범위로 clamp한다(프로토타입 수준).
  // 값이 그대로면 prev를 반환해 불필요한 재렌더/루프를 막는다.
  useEffect(() => {
    if (!region) return;
    const top = region.y;
    const bottom = region.y + region.h;
    setLineState((prev) => {
      const c0 = clampValue(prev.lineYs[0], top, bottom);
      const c1 = clampValue(prev.lineYs[1], top, bottom);
      if (c0 === prev.lineYs[0] && c1 === prev.lineYs[1]) return prev;
      return { ...prev, lineYs: [c0, c1] as [number, number] };
    });
  }, [region, setLineState]);

  // 영역 이동/리사이즈 드래그 — 핸들의 onMouseDown이 regionDragRef를 세팅하면
  // window mousemove/mouseup가 캔버스 밖으로 나가도 추적한다. 마우스 이동량(clientX/Y)을
  // canvas 픽셀로 환산(canvas.width/rect.width)해 영역을 갱신하고, 이동 시 영역 중심 x가
  // 캔버스 가로 중앙을 넘으면 좌/우 신발(mirrored)을 토글한다.
  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      const drag = regionDragRef.current;
      if (!drag) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      const dx = (e.clientX - drag.startX) * sx;
      const dy = (e.clientY - drag.startY) * sy;
      const W = canvas.width;
      const H = canvas.height;
      const o = drag.origin;

      let nextRegion: Region;
      if (drag.mode === "move") {
        nextRegion = {
          x: clampValue(o.x + dx, 0, W - o.w),
          y: clampValue(o.y + dy, 0, H - o.h),
          w: o.w,
          h: o.h,
        };
      } else {
        // 꼭짓점 리사이즈: 반대 꼭짓점(fixed)을 고정하고, 잡은 꼭짓점만 이동한다.
        const isW = drag.mode === "nw" || drag.mode === "sw";
        const isN = drag.mode === "nw" || drag.mode === "ne";
        const fx = isW ? o.x + o.w : o.x; // 고정 x(반대쪽 세로변)
        const fy = isN ? o.y + o.h : o.y; // 고정 y(반대쪽 가로변)
        let mx = clampValue((isW ? o.x : o.x + o.w) + dx, 0, W);
        let my = clampValue((isN ? o.y : o.y + o.h) + dy, 0, H);
        // 최소 크기 보장(중앙으로 당겨 축소해도 40px 유지).
        mx = isW ? Math.min(mx, fx - REGION_MIN_SIZE) : Math.max(mx, fx + REGION_MIN_SIZE);
        my = isN ? Math.min(my, fy - REGION_MIN_SIZE) : Math.max(my, fy + REGION_MIN_SIZE);
        nextRegion = {
          x: Math.min(mx, fx),
          y: Math.min(my, fy),
          w: Math.abs(fx - mx),
          h: Math.abs(fy - my),
        };
      }

      setRegion(nextRegion);
      if (drag.mode === "move") {
        // 중심 x가 캔버스 가로 중앙을 넘으면 오른쪽 신발("R")로 반전.
        const centerX = nextRegion.x + nextRegion.w / 2;
        setMirrored(centerX > W / 2);
      }
    };
    const onUp = () => {
      regionDragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [canvasRef]);

  // 영역 핸들 mousedown — 경계선 canvas 드래그와 충돌하지 않도록 stopPropagation.
  const beginRegionDrag = useCallback(
    (mode: RegionHandle) => (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (!region) return;
      regionDragRef.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        origin: region,
      };
    },
    [region]
  );

  // 상/중/하 경계선을 그린다. 의미색 레드(rgba(239,68,68,*))는 고정하되, 표현만
  // 좌우 페이드 그라디언트 + 은은한 글로우 + 둥근 라인 캡으로 다듬어 하이테크
  // 스캔라인처럼 보이게 한다. 드래그 중인 선은 굵기·글로우를 키워 조작 대상을
  // 명확히 한다(좌표·색상 값 자체는 변경하지 않음).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 경계선은 신발 영역 폭 안에서만 그린다(전폭 대신 영역 좌우변 사이).
    const lineLeft = region ? region.x : 6;
    const lineRight = region ? region.x + region.w : canvas.width - 6;
    lineState.lineYs.forEach((y, idx) => {
      const isDragging = lineState.draggingLine === idx;
      ctx.save();
      const gradient = ctx.createLinearGradient(lineLeft, 0, lineRight, 0);
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.1)");
      gradient.addColorStop(0.5, isDragging ? "rgba(239, 68, 68, 1)" : "rgba(239, 68, 68, 0.85)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.1)");
      ctx.strokeStyle = gradient; // 의미색 레드(경계 가이드) — 고정, 그라디언트로만 표현
      ctx.lineCap = "round";
      ctx.lineWidth = isDragging ? 3.5 : 2.5;
      ctx.shadowColor = "rgba(239, 68, 68, 0.85)";
      ctx.shadowBlur = isDragging ? 16 : 7;
      ctx.beginPath();
      ctx.moveTo(lineLeft, y);
      ctx.lineTo(lineRight, y);
      ctx.stroke();
      ctx.restore();
    });
  }, [canvasRef, lineState, canvasSize, region]);

  // 마우스 clientY를 canvas 비트맵 y 좌표로 변환한다.
  const toCanvasY = useCallback(
    (clientY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.height === 0) return null;
      return (clientY - rect.top) * (canvas.height / rect.height);
    },
    [canvasRef]
  );

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const y = toCanvasY(e.clientY);
    if (y === null) return;
    const idx = pickDraggableLine(lineState.lineYs, y);
    if (idx === null) return;
    // 잡은 지점의 오프셋을 저장해 드래그 중 상대 위치를 유지한다.
    setLineState((prev) => ({
      ...prev,
      draggingLine: idx,
      offsetY: prev.lineYs[idx] - y,
    }));
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const y = toCanvasY(e.clientY);
    if (y === null) return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = isNearAnyLine(lineState.lineYs, y)
        ? "pointer"
        : "default";
    }
    if (lineState.draggingLine !== null) {
      setLineState((prev) => {
        const moved = moveLine(prev.lineYs, prev.draggingLine, y, prev.offsetY);
        // 선을 신발 영역 세로 범위로 clamp한다(영역이 없으면 canvas 범위). 벗어난
        // 좌표를 그대로 두면 서버가 이미지 밖을 슬라이스하다 "tile cannot extend
        // outside image"로 죽는다.
        const h = canvas?.height ?? 0;
        const top = region ? region.y : 0;
        const bottom = region ? region.y + region.h : h;
        const clamp = (v: number) => Math.min(Math.max(v, top), bottom);
        return {
          ...prev,
          lineYs: [clamp(moved[0]), clamp(moved[1])] as [number, number],
        };
      });
    }
  };

  const stopDragging = () => {
    setLineState((prev) => ({ ...prev, draggingLine: null }));
  };

  const handleShowOrigin = useCallback(() => {
    setActiveView("현장이미지");
    onShowOrigin();
  }, [onShowOrigin]);

  const handleShowEdit = useCallback(() => {
    setActiveView("편집이미지");
    onShowEdit();
  }, [onShowEdit]);

  // 두 경계선을 화면 순서(작은 y → 큰 y)로 정렬한 값 — 부위 라벨 배치 전용
  // 파생값이며, `lineState.lineYs`(서버로 나가는 원본 순서)는 건드리지 않는다.
  const [minY, maxY] = useMemo(() => {
    const [a, b] = lineState.lineYs;
    return a <= b ? ([a, b] as const) : ([b, a] as const);
  }, [lineState.lineYs]);

  // 영역 사각의 상하좌우 경계(영역이 없으면 캔버스 전체) — 틴트/라벨/핸들 배치용
  // 표시 전용 파생값. 좌표 판정에는 관여하지 않는다.
  const regionLeft = region ? region.x : 0;
  const regionTop = region ? region.y : 0;
  const regionWidth = region ? region.w : canvasSize.w;
  const regionBottom = region ? region.y + region.h : canvasSize.h;

  const zoneBands = useMemo(
    () => [
      { label: "상", center: (regionTop + minY) / 2 },
      { label: "중", center: (minY + maxY) / 2 },
      { label: "하", center: (maxY + regionBottom) / 2 },
    ],
    [minY, maxY, regionTop, regionBottom]
  );

  const showOverlayChrome = Boolean(image) && canvasSize.h > 0;

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <TechCorners size={22} active={isExtracting} />

      {/* 패널 헤더 */}
      <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
          <ScanSearch className="size-4 text-[#4A9EFF]" aria-hidden="true" />
          신발 이미지
        </span>
        <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
          Pattern · Extract
        </span>
      </div>

      {/* 툴바: 이미지 스와퍼(세그먼트 토글) + 문양추출/초기화 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#141D2C] bg-[#0D1420]/40 px-6 py-3">
        <ToggleGroup
          type="single"
          value={activeView}
          onValueChange={(v) => {
            if (v === "현장이미지") handleShowOrigin();
            else if (v === "편집이미지") handleShowEdit();
          }}
          className="gap-0.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] p-0.5"
        >
          <ToggleGroupItem
            value="현장이미지"
            className="h-7 gap-1.5 rounded-[5px] px-2.5 text-xs font-medium text-[#8A93A6] hover:text-[#C7CEDB] data-[state=on]:border data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF]"
          >
            <Camera className="size-3.5" aria-hidden="true" />
            현장이미지
          </ToggleGroupItem>
          <ToggleGroupItem
            value="편집이미지"
            className="h-7 gap-1.5 rounded-[5px] px-2.5 text-xs font-medium text-[#8A93A6] hover:text-[#C7CEDB] data-[state=on]:border data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF]"
          >
            <ImagePlus className="size-3.5" aria-hidden="true" />
            편집이미지
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="mx-1 h-6 w-px bg-[#1E2A3C]" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <ToolButton
            icon={Radar}
            label={isExtracting ? "추출 중..." : "문양추출"}
            onClick={onExtract}
            variant="accent"
            disabled={isExtracting}
            pending={isExtracting}
          />
          <ToolButton
            icon={RotateCcw}
            label="문양초기화"
            onClick={onClear}
            disabled={isExtracting}
          />
        </div>
      </div>

      {/* 경계선 조작 안내 — 이미지 위에 겹치지 않도록 뷰포트 밖(툴바 아래)에 둔다. */}
      {image && (
        <div className="flex items-center gap-2 border-b border-[#141D2C] bg-[#0D1420]/40 px-6 py-2">
          <GripHorizontal className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
          <span className="font-mono text-[11px] text-[#8A93A6]">
            경계선을 드래그해 상·중·하를 나누세요
          </span>
        </div>
      )}

      {/* 뷰포트: 이미지 + 경계선 오버레이 canvas.
          체커보드 눈금 바 / 모서리 십자선 / 하단 상태표시줄은 crime-register
          `EvidenceImagePanel` · 검색결과 `CrimeScenePanel`과 같은 뷰포트 언어로,
          4개 화면이 하나의 시스템처럼 읽히게 한다. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#05080D]/70 px-2 py-3">
        {/* 캔버스 네 모서리 포인트 마커(좌상·우상·좌하·우하). 순수 장식이라 좌표 판정에 관여하지 않는다. */}
        <span className="pointer-events-none absolute top-2 left-2 z-10 size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_2px_rgba(74,158,255,0.7)]" aria-hidden="true" />
        <span className="pointer-events-none absolute top-2 right-2 z-10 size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_2px_rgba(74,158,255,0.7)]" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-2 left-2 z-10 size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_2px_rgba(74,158,255,0.7)]" aria-hidden="true" />
        <span className="pointer-events-none absolute right-2 bottom-2 z-10 size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_2px_rgba(74,158,255,0.7)]" aria-hidden="true" />

        {image && (
          <>
            <div
              className="absolute inset-x-1.5 top-1.5 h-[6px] rounded-sm opacity-70"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
              }}
            />
            <div
              className="absolute inset-y-1.5 left-1.5 w-[6px] rounded-sm opacity-70"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
              }}
            />
            <Crosshair className="absolute top-2.5 left-2 size-4 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
            <Crosshair className="absolute top-2.5 right-2 size-4 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
            <Crosshair className="absolute bottom-2.5 left-2 size-4 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
            <Crosshair className="absolute right-2 bottom-2.5 size-4 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
          </>
        )}

        {/* 이미지를 뷰포트 높이에 꽉 채운다: img는 h-full(높이 우선)·w-auto(종횡비 폭),
            래퍼는 h-full·w-fit으로 표시 이미지에 딱 붙어 캔버스 오버레이가 정합된다.
            높이 우선이라 세로 이미지가 위아래로 삐지지 않고 꽉 찬다. */}
        {image ? (
          <div className="relative flex h-full w-fit max-w-full items-center justify-center">
            <img
              ref={imgRef}
              src={image}
              alt="현장 신발 이미지"
              draggable={false}
              onLoad={handleImageLoad}
              className="h-full w-auto max-w-full object-contain select-none"
            />

            {/* 상/중/하 영역 배경 틴트 — 같은 파란 계열에서 깊이(투명도/명도)만 달리해
                세 구간을 은은히 구분한다(알록달록 X). canvas보다 아래(이미지 위)에 두어
                경계선/문양은 그대로 위에 그려지고, 순수 장식이라 좌표 판정에 관여하지 않는다. */}
            {showOverlayChrome && (
              <>
                <div
                  className="pointer-events-none absolute bg-[#4A9EFF]/[0.06]"
                  style={{
                    left: regionLeft,
                    width: regionWidth,
                    top: regionTop,
                    height: Math.max(0, minY - regionTop),
                  }}
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute bg-[#3B82F6]/[0.11]"
                  style={{
                    left: regionLeft,
                    width: regionWidth,
                    top: minY,
                    height: Math.max(0, maxY - minY),
                  }}
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute bg-[#1D4ED8]/[0.15]"
                  style={{
                    left: regionLeft,
                    width: regionWidth,
                    top: maxY,
                    height: Math.max(0, regionBottom - maxY),
                  }}
                  aria-hidden="true"
                />
              </>
            )}

            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
              className="absolute inset-0 size-full"
            />

            {/* 신발 영역(사각 마스크) 오버레이 — 테두리·틴트는 pointer-events-none,
                이동 그립·꼭짓점 핸들만 pointer-events-auto로 드래그를 받는다. 실제
                드래그는 window mousemove/mouseup가 처리(캔버스 밖 추적). 순수 UI
                제약이며 추출로 보내지 않는다. */}
            {showOverlayChrome && region && (
              <>
                {/* 사각 테두리(forensic 블루 글로우) */}
                <div
                  className="pointer-events-none absolute z-10 rounded-sm border border-dashed border-[#3B82F6]/70 shadow-[0_0_14px_rgba(59,130,246,0.35),inset_0_0_12px_rgba(59,130,246,0.12)]"
                  style={{
                    left: region.x,
                    top: region.y,
                    width: region.w,
                    height: region.h,
                  }}
                  aria-hidden="true"
                />

                {/* L/R 배지 + 반전 방향 글리프(mirrored면 scaleX(-1)로 뒤집힘) */}
                <div
                  className="pointer-events-none absolute z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#3B82F6]/50 bg-[#0B121D]/90 py-1 pr-2.5 pl-2 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                  style={{ left: region.x + region.w / 2, top: region.y + region.h - 16 }}
                >
                  <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#4A9EFF]">
                    {mirrored ? "R" : "L"}
                  </span>
                  <Footprints
                    className="size-3.5 text-[#4A9EFF]"
                    style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
                    aria-hidden="true"
                  />
                </div>

                {/* 이동 그립 — 영역 상단 중앙 */}
                <button
                  type="button"
                  onMouseDown={beginRegionDrag("move")}
                  className="pointer-events-auto absolute z-20 flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center rounded-full border border-[#3B82F6]/60 bg-[#152238] text-[#4A9EFF] shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-colors hover:bg-[#182b45]"
                  style={{ left: region.x + region.w / 2, top: region.y }}
                  aria-label="신발 영역 이동"
                >
                  <Move className="size-3.5" aria-hidden="true" />
                </button>

                {/* 네 꼭짓점 리사이즈 핸들 */}
                {([
                  { mode: "nw", left: region.x, top: region.y, cursor: "cursor-nwse-resize" },
                  { mode: "ne", left: region.x + region.w, top: region.y, cursor: "cursor-nesw-resize" },
                  { mode: "sw", left: region.x, top: region.y + region.h, cursor: "cursor-nesw-resize" },
                  { mode: "se", left: region.x + region.w, top: region.y + region.h, cursor: "cursor-nwse-resize" },
                ] as const).map((corner) => (
                  <button
                    key={corner.mode}
                    type="button"
                    onMouseDown={beginRegionDrag(corner.mode)}
                    className={cn(
                      "pointer-events-auto absolute z-20 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3B82F6] bg-[#0B121D] shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-colors hover:bg-[#152238]",
                      corner.cursor
                    )}
                    style={{ left: corner.left, top: corner.top }}
                    aria-label="신발 영역 크기 조절"
                  />
                ))}
              </>
            )}

            {/* 상/중/하 부위 라벨 — 두 경계선이 만드는 세 구간의 중심에 배치한다.
                순수 표시용 파생값(minY/maxY)만 사용하며 lineState는 읽기만 한다.
                PatternZones의 "필수" 배지와 같은 점+텍스트 필 언어로 통일했다. */}
            {showOverlayChrome &&
              zoneBands.map((band) => (
                <div
                  key={band.label}
                  className="pointer-events-none absolute z-10 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-[#3B82F6]/40 bg-[#0B121D]/90 py-1 pr-2.5 pl-1.5 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                  style={{ top: band.center, left: regionLeft + 6 }}
                >
                  <span
                    className="size-1.5 rounded-full bg-[#4A9EFF] shadow-[0_0_6px_rgba(74,158,255,0.85)]"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#E5E9F0]">
                    {band.label}
                  </span>
                </div>
              ))}

            {/* 경계선 핸들 — 라인 양 끝의 노브(드래그 가능함을 암시)와 우측 y값 배지로
                구성한다. 노브는 순수 장식(pointer-events-none)이며, 실제 드래그는
                canvas의 mousedown/mousemove가 라인 전체 폭에서 판정한다. */}
            {showOverlayChrome &&
              lineState.lineYs.map((y, idx) => {
                const isDragging = lineState.draggingLine === idx;
                return (
                  <div
                    key={idx}
                    className="pointer-events-none absolute z-10"
                    style={{ top: y, left: regionLeft, width: regionWidth }}
                  >
                    <span
                      className={cn(
                        "absolute left-0 flex size-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-all",
                        isDragging
                          ? "border-[#EF4444] bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.9)]"
                          : "border-[#EF4444]/70 bg-[#0B121D] shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1 rounded-full",
                          isDragging ? "bg-white" : "bg-[#EF4444]"
                        )}
                      />
                    </span>
                    <span
                      className={cn(
                        "absolute right-0 flex size-3 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-all",
                        isDragging
                          ? "border-[#EF4444] bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.9)]"
                          : "border-[#EF4444]/70 bg-[#0B121D] shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1 rounded-full",
                          isDragging ? "bg-white" : "bg-[#EF4444]"
                        )}
                      />
                    </span>
                    <div
                      className={cn(
                        "absolute right-4 flex -translate-y-1/2 items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-1 font-mono text-[10px] tabular-nums transition-colors",
                        isDragging
                          ? "border-[#EF4444]/70 bg-[#2a1214]/95 text-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                          : "border-[#1E2A3C] bg-[#0B121D]/85 text-[#8A93A6]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded-full",
                          isDragging ? "bg-[#EF4444]/20" : "bg-[#1E2A3C]"
                        )}
                      >
                        <GripHorizontal className="size-2.5" aria-hidden="true" />
                      </span>
                      {Math.round(y)}
                    </div>
                  </div>
                );
              })}

          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[#5B6B85]">
            <ImageOff className="size-9" aria-hidden="true" />
            <span className="text-sm font-medium">표시할 이미지가 없습니다</span>
          </div>
        )}

        {/* 중앙 하단 배치 — 좌측 상/중/하 부위 라벨, 우측 경계선 핸들 태그와 겹치지 않도록
            EvidenceImagePanel/CrimeScenePanel의 좌하단 배치 대신 중앙을 쓴다. */}
        {image && (
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-wider text-[#5B6B85]">
            KCSI / Forensic Imaging
          </span>
        )}

        {/* 추출 진행 오버레이(레거시 LoadingModal 대체) */}
        {isExtracting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#05080D]/80 backdrop-blur-sm">
            <Radar
              className="size-8 animate-spin text-[#4A9EFF]"
              aria-hidden="true"
            />
            <span className="font-mono text-[13px] tracking-wide text-[#C7CEDB]">
              패턴 추출 중...
            </span>
          </div>
        )}
      </div>

      {/* 하단 상태표시줄 — EvidenceImagePanel/CrimeScenePanel과 같은 톤으로
          치수·현재 뷰·경계선 개수를 요약한다(표시 전용, 파생값만 사용). */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[#141D2C] px-6 py-3">
        <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2.5 py-1 font-mono text-[11px] tabular-nums text-[#8A93A6]">
          {naturalSize.w} x {naturalSize.h} px
        </span>
        <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase">
          {activeView}
        </span>
        <span className="ml-auto font-mono text-[11px] tracking-wide text-[#6B7688] uppercase">
          Line Edit · {lineState.lineYs.length} Boundaries
        </span>
      </div>
    </section>
  );
}

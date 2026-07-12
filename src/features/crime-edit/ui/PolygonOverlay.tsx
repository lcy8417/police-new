import { useMemo } from "react";

import { cn } from "@/shared/lib/utils";

import type { Point } from "../lib/polygon-geometry";
import type { EditTool } from "../model/use-image-edit";

/**
 * 폴리곤 마스크 시각화 오버레이(배경제거·인페인팅 전용). **순수 장식**이라 전체가
 * `pointer-events-none` — 클릭/우클릭 좌표 판정은 EditCanvas의 오버레이 canvas가 소유하며,
 * 이 레이어는 그 위에서 정점·마칭앤츠·채움 틴트만 그린다(좌표 판정 절대 차단 금지).
 *
 * 좌표계: `points`는 표시 이미지 rect 기준 **정수 px**(EditCanvas가 `clientX-rect.left`로 캡처).
 * 이 오버레이도 같은 rect(표시 이미지)에 `absolute inset-0`로 얹히므로, 정점 [x,y]를 SVG
 * user unit(=CSS px)에 1:1로 찍으면 클릭 지점과 정확히 겹친다.
 */
export interface PolygonOverlayProps {
  /** 수집된 폴리곤 정점(표시 이미지 rect 기준 정수 px, canvas-local). */
  points: Point[];
  /** 현재 편집 툴 — 폴리곤 툴(background/inpaint)일 때만 의미 색을 달리해 그린다. */
  activeTool: EditTool | null;
}

/** 툴별 의미색: 배경제거=blue(추출), 인페인팅=teal(소스 복원). red는 경계선 전용이라 회피. */
const TOOL_ACCENT: Record<"background" | "inpaint", { stroke: string; fill: string }> = {
  background: { stroke: "#4A9EFF", fill: "rgba(74,158,255,0.22)" },
  inpaint: { stroke: "#2DD4BF", fill: "rgba(45,212,191,0.2)" },
};

/** 툴별 배지 점 색·글로우 — 인라인 style 대신 Tailwind로(색은 Tailwind 규약, 좌표만 인라인). */
const TOOL_DOT_CLASS: Record<"background" | "inpaint", string> = {
  background: "bg-[#4A9EFF] shadow-[0_0_6px_#4A9EFF]",
  inpaint: "bg-[#2DD4BF] shadow-[0_0_6px_#2DD4BF]",
};

/** 첫 정점 근접 "닫기" 판정 반경(px). 이 안이면 첫 정점을 강조해 닫힘을 어포던스. */
const CLOSE_RADIUS = 14;

export function PolygonOverlay({ points, activeTool }: PolygonOverlayProps) {
  const isPolygonTool = activeTool === "background" || activeTool === "inpaint";
  const accent = isPolygonTool ? TOOL_ACCENT[activeTool] : null;

  // 정점 문자열("x,y x,y ...") — polyline/polygon 공용. 정점 없으면 빈 문자열.
  const pointsStr = useMemo(
    () => points.map(([x, y]) => `${x},${y}`).join(" "),
    [points]
  );

  if (!isPolygonTool || !accent) return null;

  const count = points.length;
  const canClose = count >= 3; // 3점 이상이면 닫아서 제출 가능
  const first = points[0];
  const last = points[count - 1];

  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      <svg
        className="absolute inset-0 size-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* 채움 틴트 — 3점 이상일 때 닫힌 폴리곤을 반투명으로 채워 마스크 영역을 예고. */}
        {canClose && (
          <polygon points={pointsStr} fill={accent.fill} stroke="none" />
        )}

        {/* 닫힘 예고 변(마지막→첫) — 아직 열린 상태에서 어디로 닫힐지 힌트(더 흐린 대시). */}
        {count >= 2 && first && last && (
          <line
            x1={last[0]}
            y1={last[1]}
            x2={first[0]}
            y2={first[1]}
            stroke={accent.stroke}
            strokeOpacity={0.4}
            strokeWidth={1.5}
            strokeDasharray="2 6"
            strokeLinecap="round"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="16"
              to="0"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </line>
        )}

        {/* 마칭앤츠 — 정점을 잇는 열린 경로. dashoffset 애니메이션으로 개미행렬 효과. */}
        {count >= 2 && (
          <polyline
            points={pointsStr}
            fill="none"
            stroke={accent.stroke}
            strokeWidth={2}
            strokeDasharray="7 5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_4px_rgba(74,158,255,0.5)]"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="24"
              to="0"
              dur="0.7s"
              repeatCount="indefinite"
            />
          </polyline>
        )}

        {/* 정점 핸들 — 드래그 핸들 느낌의 점(액센트 링 + 짙은 코어). */}
        {points.map(([x, y], idx) => {
          const isFirst = idx === 0;
          const emphasizeFirst = isFirst && canClose;
          return (
            <g key={idx}>
              {/* 첫 정점 닫기 어포던스 — 3점 이상이면 펄스 링으로 "여기서 닫기" 강조. */}
              {emphasizeFirst && (
                <circle
                  cx={x}
                  cy={y}
                  r={CLOSE_RADIUS - 4}
                  fill="none"
                  stroke={accent.stroke}
                  strokeWidth={1.5}
                >
                  <animate
                    attributeName="r"
                    values={`${CLOSE_RADIUS - 6};${CLOSE_RADIUS + 2};${CLOSE_RADIUS - 6}`}
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    values="0.9;0.1;0.9"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={x}
                cy={y}
                r={emphasizeFirst ? 5.5 : 4.5}
                fill="#0B121D"
                stroke={accent.stroke}
                strokeWidth={2}
                className="drop-shadow-[0_0_5px_rgba(74,158,255,0.6)]"
              />
              <circle cx={x} cy={y} r={1.6} fill={accent.stroke} />
            </g>
          );
        })}
      </svg>

      {/* 실시간 정점 수 배지 + 닫기 안내 — 마지막 정점 옆에 붙는다(HTML, px 좌표 공유). */}
      {count > 0 && last && (
        <div
          className="absolute flex -translate-y-1/2 translate-x-3 items-center gap-1.5 rounded-full border border-[#1E2A3C] bg-[#0B121D]/90 py-0.5 pr-2.5 pl-1.5 font-mono text-[10px] tabular-nums whitespace-nowrap text-[#C7CEDB] shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          style={{ left: last[0], top: last[1] }}
        >
          <span className={cn("size-1.5 rounded-full", TOOL_DOT_CLASS[activeTool])} />
          {count}점
          {canClose && <span className="text-[#8A93A6]">· 우클릭 닫기</span>}
        </div>
      )}
    </div>
  );
}

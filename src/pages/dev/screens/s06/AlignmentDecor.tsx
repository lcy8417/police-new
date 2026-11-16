import type { Alignment } from "@/entities/alignment"

import { FakePhoto } from "../mock-assets/FakePhoto"
import { CRIME_SIZE } from "./mock-cases"

// S06 정렬 설정 슬롯에 넣는 진열용 고정 장식(spec §6-1): 가짜 현장 사진 + 관심영역 다각형 + 방향 화살표.
// 조작할 수 없다(pointer-events-none). 운영은 이 자리에 AlignmentCaptureCanvas 를 그대로 끼운다(좌표 수학은 그쪽 소유).
// src(표본 현장 사진)를 주면 가짜 그림 대신 그 사진을 같은 틀에 채운다(가짜 그림처럼 잘라 채움 — 다각형 좌표는 그대로).
export function AlignmentDecor({ alignment, src }: { alignment: Alignment; src?: string }) {
  const polygon = alignment.polygon ?? []
  const arrow = alignment.arrow ?? []
  const [tail, head] = arrow
  return (
    <div className="pointer-events-none mx-auto aspect-[2/3] h-full" data-alignment-decor>
      <div className="relative size-full">
        {src ? (
          <img src={src} alt="" className="block size-full object-cover" />
        ) : (
          <FakePhoto zones={["herring", "grid", "tri"]} rotate={0} tag="1" />
        )}
        <svg
          viewBox={`0 0 ${CRIME_SIZE.width} ${CRIME_SIZE.height}`}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <polygon
            points={polygon.map(([x, y]) => `${x},${y}`).join(" ")}
            className="fill-brand/10 stroke-brand"
            strokeWidth={6}
            strokeDasharray="18 10"
          />
          {polygon.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={14} className="fill-canvas stroke-brand" strokeWidth={5} />
          ))}
          {tail && head ? (
            <>
              <line x1={tail[0]} y1={tail[1]} x2={head[0]} y2={head[1] + 40} className="stroke-ai" strokeWidth={10} />
              <polygon
                points={`${head[0]},${head[1]} ${head[0] - 40},${head[1] + 70} ${head[0] + 40},${head[1] + 70}`}
                className="fill-ai"
              />
            </>
          ) : null}
        </svg>
      </div>
    </div>
  )
}

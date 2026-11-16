import * as React from "react"

import { partAttrs } from "../part-attrs"

// 시안 `.crumb`: 위치 표시. 마지막 항목이 현재 위치다.
export interface CrumbProps {
  items: string[]
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function Crumb({ items, partId }: CrumbProps) {
  return (
    <div
      {...partAttrs("Crumb", { id: partId })}
      className="font-code text-[10px] font-semibold tracking-[0.16em] text-dim"
    >
      {items.map((item, i) => (
        <React.Fragment key={`${i}-${item}`}>
          {i > 0 && (
            <span aria-hidden="true" className="mx-[6px]">
              ›
            </span>
          )}
          <span aria-current={i === items.length - 1 ? "page" : undefined}>{item}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

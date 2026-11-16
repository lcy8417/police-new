import * as React from "react"

import { partAttrs } from "../part-attrs"

// 시안 `.page-head`: 쪽 제목(h3) · 설명 · 오른쪽 내용. 아래 여백 14px.
export interface PageHeadProps {
  title: string
  description?: string
  actions?: React.ReactNode
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function PageHead({ title, description, actions, partId }: PageHeadProps) {
  return (
    <div
      {...partAttrs("PageHead", { id: partId })}
      className="mb-[14px] flex items-end justify-between gap-[16px]"
    >
      <div>
        <h3 className="m-0 text-[22px] leading-[1.2]">{title}</h3>
        {description && <p className="mt-[4px] mb-0 text-[12.5px] text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

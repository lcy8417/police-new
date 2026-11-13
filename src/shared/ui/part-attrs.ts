// 시안 표식(data-part-*) 속성 묶음. 값이 없는 키는 결과에서 뺀다.
// `data-state` 는 shadcn 예약이라 쓰지 않는다.
export interface PartAttrsOptions {
  /** 변형 이름(예: "pri") */
  variant?: string
  /** 상태 이름(예: "on") */
  state?: string
  /** 시안 위치 식별자(형식 `S01-03`) */
  id?: string
}

export type PartAttrs = Partial<
  Record<"data-part-variant" | "data-part-state" | "data-part-id", string>
> &
  Record<"data-part", string>

export function partAttrs(part: string, opts: PartAttrsOptions = {}): PartAttrs {
  const attrs: PartAttrs = { "data-part": part }
  if (opts.variant) attrs["data-part-variant"] = opts.variant
  if (opts.state) attrs["data-part-state"] = opts.state
  if (opts.id) attrs["data-part-id"] = opts.id
  return attrs
}

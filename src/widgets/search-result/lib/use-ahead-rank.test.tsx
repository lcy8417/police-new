import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"

import { aheadWatchKey, useAheadRank } from "./use-ahead-rank"

const observed: string[] = []

class IOStub {
  observe(el: Element) {
    observed.push((el as HTMLElement).dataset.id ?? "")
  }
  unobserve() {}
  disconnect() {}
}

afterEach(() => {
  vi.unstubAllGlobals()
  observed.length = 0
})

function List({ ids }: { ids: string[] }) {
  const ref = React.useRef<HTMLDivElement>(null)
  useAheadRank(ref, aheadWatchKey("ready", ids, 4, "all"))
  return (
    <div ref={ref}>
      {ids.map((id, i) => (
        <div key={id} data-result-card data-rank={i + 1} data-id={id} />
      ))}
    </div>
  )
}

describe("useAheadRank — 미리 받을 카드 지켜보기", () => {
  it("[검수] 결과가 같은 개수로 통째로 바뀌어도(조건 변경 뒤 다시 50건) 새 카드를 다시 지켜본다", () => {
    vi.stubGlobal("IntersectionObserver", IOStub)
    const view = render(<List ids={["a", "b"]} />)
    expect(observed).toEqual(["a", "b"])
    view.rerender(<List ids={["c", "d"]} />)
    expect(observed).toEqual(["a", "b", "c", "d"])
  })
})

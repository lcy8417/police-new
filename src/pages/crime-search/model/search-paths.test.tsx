import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom"

import {
  crimeHistoryPath,
  resultDetailPath,
  searchDetailPath,
} from "./search-paths"

const APRTHNG_NO = "05019-24-0017_5"

/** 라우트가 읽은 URL 변수를 그대로 화면에 찍어 round-trip(왕복)을 확인한다. */
function ParamsProbe() {
  const params = useParams()
  return <pre data-testid="params">{JSON.stringify(params)}</pre>
}

function readParams(path: string, routePath: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={<ParamsProbe />} />
      </Routes>
    </MemoryRouter>
  )
  return JSON.parse(screen.getByTestId("params").textContent ?? "{}")
}

describe("search-paths", () => {
  it("encodes and decodes aprthngNo", () => {
    const path = searchDetailPath(APRTHNG_NO)
    expect(path).toBe(`/search/${encodeURIComponent(APRTHNG_NO)}`)
    expect(readParams(path, "/search/:aprthngNo")).toEqual({ aprthngNo: APRTHNG_NO })
  })

  it("허용 밖 문자(`/`·`#`·공백)도 인코딩해 경로가 깨지지 않는다", () => {
    const weird = "a/b #c"
    const path = searchDetailPath(weird)
    expect(path).toBe("/search/a%2Fb%20%23c")
    expect(readParams(path, "/search/:aprthngNo")).toEqual({ aprthngNo: weird })
  })

  it("crimeHistoryPath는 aprthngNo·searchNo·ranking을 담는다", () => {
    const path = crimeHistoryPath(APRTHNG_NO, 42, { ranking: 3 })
    expect(path).toBe(`/search/${APRTHNG_NO}/crimeHistory/42?ranking=3`)
    const [pathname] = path.split("?")
    expect(
      readParams(pathname, "/search/:aprthngNo/crimeHistory/:searchNo")
    ).toEqual({ aprthngNo: APRTHNG_NO, searchNo: "42" })
  })

  it("resultDetailPath는 앞자리 0 신발 ID를 그대로 둔다", () => {
    const path = resultDetailPath(APRTHNG_NO, "00758", { ranking: 1 })
    expect(path).toBe(`/search/${APRTHNG_NO}/shoesResult/detail/00758?ranking=1`)
    const [pathname] = path.split("?")
    expect(
      readParams(pathname, "/search/:aprthngNo/shoesResult/detail/:ftwrId")
    ).toEqual({ aprthngNo: APRTHNG_NO, ftwrId: "00758" })
  })
})

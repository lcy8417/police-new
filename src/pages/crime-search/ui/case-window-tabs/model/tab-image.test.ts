import { afterEach, describe, expect, it, vi } from "vitest"

import type { RequestDetail, RequestImage } from "@/entities/request"

import { toTabImage } from "./tab-image"

afterEach(() => vi.unstubAllEnvs())

const detail = { apprslReqestNo: "05019-24-0017", crimeNm: "절도", rqestOrgNm: "종로서" } as unknown as RequestDetail
const image = (thumbUrl: string | null) =>
  ({ aprthngNo: "05019-24-0017_1", pickDt: null, pickPlace: null, pickMthCode: null, thumbUrl, frstRegistDt: null }) as unknown as RequestImage

describe("toTabImage — A2 감정물 → 탭 이미지", () => {
  it("[검수] 현장 그림 경로(루트 기준)에 API 주소를 붙인다 — 다른 주소의 VITE_API_URL 이면 그 서버로", () => {
    vi.stubEnv("VITE_API_URL", "https://api.example:8000")
    expect(toTabImage(detail, image("/crime_images/05019-24-0017_1.png"), null).image).toBe(
      "https://api.example:8000/crime_images/05019-24-0017_1.png"
    )
  })

  it("볼 수 없는 사람(경로 없음)은 null 그대로", () => {
    expect(toTabImage(detail, image(null), null).image).toBeNull()
  })
})

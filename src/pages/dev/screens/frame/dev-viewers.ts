import { useSearchParams } from "react-router-dom"

import { FEATURES, type FeatureCode } from "@/entities/session"

// 진열 화면용 「보는 사람」 3종(`?as=`). 이름은 진열용이고 실제 역할 코드와 무관하다(spec §6-2).
export type DevViewer = "admin" | "investigator" | "readonly"

export const DEV_VIEWERS: Record<DevViewer, { label: string; isAdmin: boolean; features: readonly FeatureCode[] }> = {
  admin: { label: "관리자", isAdmin: true, features: Object.values(FEATURES) },
  investigator: {
    label: "수사관",
    isAdmin: false,
    features: [FEATURES.CRIME_REGISTER, FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW],
  },
  readonly: { label: "보기 전용", isAdmin: false, features: [FEATURES.SHOE_VIEW] },
}

export const DEV_VIEWER_KEYS = Object.keys(DEV_VIEWERS) as DevViewer[]

/** `?as=` 로 고른 보는 사람. 없거나 모르는 값이면 investigator. */
export function useDevViewer(): (typeof DEV_VIEWERS)[DevViewer] {
  const [params] = useSearchParams()
  const as = params.get("as")
  return DEV_VIEWER_KEYS.find((k) => k === as) ? DEV_VIEWERS[as as DevViewer] : DEV_VIEWERS.investigator
}

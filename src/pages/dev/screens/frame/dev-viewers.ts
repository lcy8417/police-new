import { useLocation, useSearchParams } from "react-router-dom"

import { FEATURES, type FeatureCode } from "@/entities/session"

import { DEV_SCREENS } from "./dev-screens"

// 진열 화면용 「보는 사람」 5종(`?as=`). 라벨 · 이름 · 소속은 시안 `M.ROLES`(core.js) 그대로이고,
// 기능 권한은 실증 설계서의 역할 배정을 따른다. 관리자 · 보기 전용은 진열용이다(spec §6-2).
export type DevViewer = "investigator" | "analyst" | "verifier" | "admin" | "readonly"

export interface DevViewerInfo {
  label: string
  who: string
  org: string
  isAdmin: boolean
  features: readonly FeatureCode[]
}

const F = FEATURES

export const DEV_VIEWERS: Record<DevViewer, DevViewerInfo> = {
  investigator: {
    label: "수사관",
    who: "이○○ 경사",
    org: "대구청 과학수사계",
    isAdmin: false,
    features: [F.CRIME_REGISTER, F.CASE_STATUS_VIEW, F.REPORT_VIEW],
  },
  analyst: {
    label: "감정관",
    who: "박○○ 경위",
    org: "경찰청 범죄분석과",
    isAdmin: false,
    features: [
      F.CRIME_REGISTER,
      F.CRIME_SEARCH,
      F.SHOE_VIEW,
      F.SHOE_EDIT,
      F.CASE_STATUS_VIEW,
      F.REPORT_VIEW,
      F.EXAM_DECIDE,
      F.CROSS_REVIEW,
      F.REPORT_WRITE,
      F.SHOE_COLLECT_REVIEW,
    ],
  },
  verifier: {
    label: "기술책임자",
    who: "최○○ 경감",
    org: "족윤적 기술책임자",
    isAdmin: false,
    features: [F.CRIME_SEARCH, F.SHOE_VIEW, F.CASE_STATUS_VIEW, F.REPORT_VIEW, F.REPORT_APPROVE, F.REPORT_SEND],
  },
  admin: {
    label: "관리자",
    who: "시스템 관리자",
    org: "경찰청 과학수사관리관실",
    isAdmin: true,
    features: Object.values(FEATURES),
  },
  readonly: { label: "보기 전용", who: "열람 계정", org: "경찰청 범죄분석과", isAdmin: false, features: [F.SHOE_VIEW] },
}

export const DEV_VIEWER_KEYS = Object.keys(DEV_VIEWERS) as DevViewer[]

/** 보는 사람(`?as=`) 값이 5종 중 하나인지 */
export function isDevViewer(value: string | null): value is DevViewer {
  return DEV_VIEWER_KEYS.some((k) => k === value)
}

/** 지금 주소(`/dev/<id>`)의 화면 기본 역할. 화면을 못 찾으면 analyst. */
export function defaultViewerKey(pathname: string): DevViewer {
  const id = pathname.split("/")[2]
  return DEV_SCREENS.find((s) => s.id === id)?.defaultViewer ?? "analyst"
}

/** `?as=` 로 고른 보는 사람의 키. 없거나 모르는 값이면 이 화면의 기본 역할. */
export function useDevViewerKey(): DevViewer {
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const as = params.get("as")
  return isDevViewer(as) ? as : defaultViewerKey(pathname)
}

export function useDevViewer(): DevViewerInfo {
  return DEV_VIEWERS[useDevViewerKey()]
}

/** `?plus=0` 이면 false(신규 기능 끄기), 그 외 true. */
export function useDevPlus(): boolean {
  const [params] = useSearchParams()
  return params.get("plus") !== "0"
}

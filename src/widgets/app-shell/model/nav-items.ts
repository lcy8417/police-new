import {
  FileText,
  ListFilter,
  Footprints,
  FileSearch,
  FileCheck2,
  ScrollText,
  UserCog,
  type LucideIcon,
} from "lucide-react"

import { FEATURES, type FeatureCode, type SessionUser } from "@/entities/session"
import { hasFeature, isAdmin } from "@/features/auth"

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  disabled?: boolean
  disabledReason?: string
  /** 이 메뉴를 보려면 필요한 기능 권한 — 없으면 메뉴를 숨긴다(비활성 표시 금지, 설계서 §2). */
  feature?: FeatureCode
  /** true면 관리자에게만 보이는 "관리" 구역(`ADMIN`) 메뉴. */
  adminOnly?: boolean
}

export const navItems: NavItem[] = [
  { label: "사건 등록", to: "/crimeRegister", icon: FileText, feature: FEATURES.CRIME_REGISTER },
  { label: "사건 조회", to: "/search", icon: ListFilter, feature: FEATURES.CRIME_SEARCH },
  { label: "신발", to: "/shoesRepository", icon: Footprints, feature: FEATURES.SHOE_VIEW },
  {
    label: "감정 의뢰",
    to: "",
    icon: FileSearch,
    disabled: true,
    disabledReason: "사건을 먼저 선택하세요",
    feature: FEATURES.CRIME_SEARCH,
  },
  {
    label: "감정 결과",
    to: "",
    icon: FileCheck2,
    disabled: true,
    disabledReason: "사건을 먼저 선택하세요",
    feature: FEATURES.CRIME_SEARCH,
  },
  { label: "사용자·권한", to: "/manage/users", icon: UserCog, adminOnly: true },
  { label: "사용 기록", to: "/manage/logs", icon: ScrollText, adminOnly: true },
]

/**
 * 이 사용자에게 보일 메뉴 — 기능 권한이 없는 메뉴와(관리자가 아니면) 관리 구역을 뺀다.
 * 관리자는 `hasFeature`가 항상 true라 모든 메뉴를 본다.
 */
export function visibleNavItems(user: SessionUser): NavItem[] {
  return navItems.filter((item) => {
    if (item.adminOnly) return isAdmin(user)
    return item.feature ? hasFeature(user, item.feature) : true
  })
}

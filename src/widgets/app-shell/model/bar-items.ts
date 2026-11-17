import { Footprints, Settings2 } from "lucide-react"

import { FEATURES, type SessionUser } from "@/entities/session"
import { hasFeature, isAdmin } from "@/features/auth"
import type { ScasBarItem } from "@/shared/ui/panel"

// 새 앱 틀(`ScasAppShell`, 결정 기록 §1): 왼쪽 사이드바 없이 남색 위 막대 한 줄 —
//  [방패 족적 감정 │ 화면 이름 · 건수   바로 찾기 · 신발 DB · 관리 ▾(관리자) · 화면 설정 · 사용자]
// 사건관리(`/cases`)가 집이다. 신발 DB 는 사건관리 위 슬라이드 패널(`/cases?shoe=1`), 관리 ▾ = 사용자 관리 · 사용 기록 전체 화면.
// 권한이 없는 단추는 숨긴다(비활성 표시 금지 — 설계서 §2).

/** 새 사건관리 목록 주소(집 — 화면 이식 계획 §1, 옛 `/search` 와 나란히) */
export const CASES_PATH = "/cases"

/** 주소 → 위 막대 제목 */
export function barTitleOf(pathname: string): string {
  if (pathname.startsWith(CASES_PATH)) return "사건관리"
  if (pathname.startsWith("/manage/logs")) return "사용 기록"
  if (pathname.startsWith("/manage")) return "사용자 관리"
  return "족적 감정"
}

/** 사건관리 목록을 볼 수 있나(사건 조회 권한 — 목록 API `GET /crime/` 가 이 권한) */
export function canSeeCases(user: SessionUser): boolean {
  return hasFeature(user, FEATURES.CRIME_SEARCH)
}

/**
 * 신발 DB 단추가 갈 곳. 사건관리를 볼 수 있으면 사건관리 위 패널(`shoe=1` — 사건관리에 있으면 열린 사건 창 주소는 그대로 두고 더한다),
 * 사건관리를 못 보면(신발 조회만) 옛 신발 화면 `/shoesRepository`(넘겨주기 전까지 — 계획 §1).
 */
export function shoeDbHref(user: SessionUser, pathname: string, search: string): string {
  if (!canSeeCases(user)) return "/shoesRepository"
  if (pathname !== CASES_PATH) return `${CASES_PATH}?shoe=1`
  const params = new URLSearchParams(search)
  params.set("shoe", "1")
  return `${CASES_PATH}?${params.toString()}`
}

/** 이 사용자 · 이 주소의 위 막대 단추(신발 DB · 관리 ▾) */
export function barItemsFor(user: SessionUser, pathname: string, search: string): ScasBarItem[] {
  const items: ScasBarItem[] = []
  if (hasFeature(user, FEATURES.SHOE_VIEW)) {
    const panelOpen = pathname === CASES_PATH && new URLSearchParams(search).get("shoe") === "1"
    items.push({ label: "신발 DB", icon: Footprints, href: shoeDbHref(user, pathname, search), active: panelOpen })
  }
  if (isAdmin(user)) {
    items.push({
      label: "관리",
      icon: Settings2,
      active: pathname.startsWith("/manage"),
      items: [
        { label: "사용자 관리", href: "/manage/users" },
        { label: "사용 기록", href: "/manage/logs" },
      ],
    })
  }
  return items
}

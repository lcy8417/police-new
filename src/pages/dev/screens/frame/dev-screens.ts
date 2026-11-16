// 진열 화면 목록(11개). 주소 `/dev/<id>`, 목차 · 왼쪽 메뉴가 함께 쓴다.
export interface DevScreenInfo {
  id: string
  /** 시안 화면 번호 */
  screen: string
  title: string
  /** 관리자만 보이는 메뉴 묶음에 놓는가 */
  admin?: boolean
}

export const DEV_SCREENS: readonly DevScreenInfo[] = [
  { id: "s00", screen: "S00", title: "로그인" },
  { id: "s01", screen: "S01", title: "사건관리" },
  { id: "s02", screen: "S02", title: "사건 상세" },
  { id: "s03", screen: "S03", title: "이미지 편집" },
  { id: "s04", screen: "S04", title: "문양 코드" },
  { id: "s05", screen: "S05", title: "검색 결과" },
  { id: "s06", screen: "S06", title: "정밀 대조" },
  { id: "s07", screen: "S07", title: "결과 확인" },
  { id: "s10", screen: "S10", title: "신발 DB" },
  { id: "s13", screen: "S13", title: "사용자 관리", admin: true },
  { id: "s14", screen: "S14", title: "사용 기록", admin: true },
]

export const DEV_CASES = ["ready", "loading", "error", "empty"] as const

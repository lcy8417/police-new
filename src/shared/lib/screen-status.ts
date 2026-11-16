// 화면이 받는 조회 상태. 실패를 빈 결과로 덮지 않도록 4가지를 구분한다(정본 스킬 「모르는 것을 없다고 보여 주지 않는다」).
export type ScreenStatus = "loading" | "error" | "empty" | "ready"

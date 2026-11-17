import { create } from "zustand"

/**
 * 「검색 결과」 탭이 볼 검색(검색번호) — 감정물별. 문양 코드 탭의 「검색」(D1 기록) · 이력 「결과 보기」가 정하고,
 * 검색 결과 탭(D4)이 읽는다. 없으면 그 감정물의 가장 최근 검색. 서버에 저장하지 않는 화면 상태(탭을 옮겨도 이어지게 감정물별로 든다).
 */
interface SearchRunSessionStore {
  byImage: Readonly<Record<string, number>>
  setRun: (aprthngNo: string, searchNo: number) => void
}

export const useSearchRunSession = create<SearchRunSessionStore>((set) => ({
  byImage: {},
  setRun: (aprthngNo, searchNo) => set((s) => ({ byImage: { ...s.byImage, [aprthngNo]: searchNo } })),
}))

/** 이 감정물에서 고른 검색번호(없으면 null) */
export function useSelectedRun(aprthngNo: string): number | null {
  return useSearchRunSession((s) => s.byImage[aprthngNo] ?? null)
}

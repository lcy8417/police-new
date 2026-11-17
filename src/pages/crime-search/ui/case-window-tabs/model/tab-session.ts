import { create } from "zustand"

// 사건 창 탭 사이에 넘겨야 하는 화면 상태(서버에 저장하지 않음) — 탭을 옮기면 탭 본문이 새로 그려지므로 이미지(감정물)별로 여기 든다.
//   검색 이미지(원본 · 편집본): 문양 코드 탭이 고르고 검색 결과 탭이 같은 이미지로 검색한다(지금 앱 「편집 검색」).
//   대조 후보: 검색 결과 탭에서 고른 신발 + 그때의 결과 목록 → 정밀 대조 탭의 이전 · 다음.

/** 검색 · 추출에 쓸 이미지 */
export type TabSearchImage = "original" | "edited"

/** 정밀 대조 후보 한 켤레(검색 결과 순서) */
export interface TabCompareCandidate {
  /** 신발 ID — 문자열 그대로(앞자리 0 보존) */
  ftwrId: string
  /** 검색 결과 순위(1부터) */
  rank: number
  /** 유사도 퍼센트 0~100 */
  similarity: number | string
  /** 이 후보를 고른 검색 번호(검색 기록이 있을 때) — 정밀 대조 「확인대상」 저장(E3)에 쓴다. 없으면 기록 없는 즉석 검색 */
  searchNo?: number
}

interface ImageSession {
  searchImage: TabSearchImage
  /** 정밀 대조할 신발(없으면 아직 고르지 않음) */
  compare: TabCompareCandidate | null
  /** 정밀 대조 이전 · 다음이 걷는 후보(검색 결과 순서) */
  candidates: readonly TabCompareCandidate[]
}

const EMPTY: ImageSession = { searchImage: "original", compare: null, candidates: [] }

interface TabSessionStore {
  byImage: Readonly<Record<string, ImageSession>>
  setSearchImage: (aprthngNo: string, next: TabSearchImage) => void
  setCompare: (aprthngNo: string, target: TabCompareCandidate | null, candidates?: readonly TabCompareCandidate[]) => void
}

export const useTabSessionStore = create<TabSessionStore>((set) => ({
  byImage: {},
  setSearchImage: (aprthngNo, next) =>
    set((s) => ({ byImage: { ...s.byImage, [aprthngNo]: { ...(s.byImage[aprthngNo] ?? EMPTY), searchImage: next } } })),
  setCompare: (aprthngNo, target, candidates) =>
    set((s) => {
      const prev = s.byImage[aprthngNo] ?? EMPTY
      return { byImage: { ...s.byImage, [aprthngNo]: { ...prev, compare: target, candidates: candidates ?? prev.candidates } } }
    }),
}))

/** 이 이미지의 탭 상태(없으면 빈 값) */
export function useImageSession(aprthngNo: string): ImageSession {
  return useTabSessionStore((s) => s.byImage[aprthngNo] ?? EMPTY)
}

import { useEffect, type ReactNode } from "react"
import { create } from "zustand"

import type { ScasShellSearch } from "@/shared/ui/panel"

interface PageHeaderState {
  /** (옛 화면) 페이지가 올린 제목. 11/17 위 막대 한 줄에서는 쓰지 않고 주소로 제목을 정한다 — 옛 화면 호환으로만 받는다 */
  title: ReactNode
  /** 위 막대 오른쪽(화면 설정 앞)에 놓는 페이지 단추 */
  actions: ReactNode
  /** 위 막대 제목 뒤 작은 글자(사건관리 = 「12건」) */
  meta: ReactNode
  /** 위 막대 바로 찾기 칸(사건관리만). 없으면 칸이 없다 */
  search: ScasShellSearch | null
}

interface PageHeaderStore extends PageHeaderState {
  setHeader: (state: PageHeaderState) => void
}

const EMPTY_HEADER: PageHeaderState = { title: null, actions: null, meta: null, search: null }

/**
 * 지금 페이지가 위 막대에 올리는 값(제목 · 단추 · 건수 · 바로 찾기). 페이지가 `usePageHeader` 로 올리고,
 * 앱 틀(`AppShell`)이 구독해 `ScasShell` 위 막대에 그린다.
 */
export const usePageHeaderStore = create<PageHeaderStore>((set) => ({
  ...EMPTY_HEADER,
  setHeader: (state) => set(state),
}))

interface UsePageHeaderOptions {
  title?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
  search?: ScasShellSearch | null
}

/**
 * 부른 컴포넌트가 살아 있는 동안 위 막대 값을 올린다(사라지면 비움). 값이 렌더마다 새 객체면 매번 다시 올리므로
 * `search` · `meta` 는 쓰는 쪽이 useMemo 로 묶는다.
 */
export function usePageHeader({ title = null, actions = null, meta = null, search = null }: UsePageHeaderOptions) {
  const setHeader = usePageHeaderStore((s) => s.setHeader)

  useEffect(() => {
    setHeader({ title, actions, meta, search })
    return () => setHeader(EMPTY_HEADER)
  }, [setHeader, title, actions, meta, search])
}

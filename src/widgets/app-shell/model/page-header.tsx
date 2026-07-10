import { useEffect, type ReactNode } from "react"
import { create } from "zustand"

interface PageHeaderState {
  title: ReactNode
  actions: ReactNode
}

interface PageHeaderStore extends PageHeaderState {
  setHeader: (state: PageHeaderState) => void
}

const EMPTY_HEADER: PageHeaderState = { title: null, actions: null }

/**
 * Holds the current page's title + actions so `TopNav` can render them.
 * Zustand store (replaces the former Context + `PageHeaderProvider`): route
 * pages publish their title/actions via `usePageHeader`, `TopNav` subscribes.
 */
export const usePageHeaderStore = create<PageHeaderStore>((set) => ({
  ...EMPTY_HEADER,
  setHeader: (state) => set(state),
}))

interface UsePageHeaderOptions {
  title?: ReactNode
  actions?: ReactNode
}

/**
 * Publishes `title`/`actions` into the shell's TopNav for the lifetime of
 * the calling component. Clears itself on unmount. Public signature is
 * unchanged from the Context era so existing callers keep working.
 */
export function usePageHeader({
  title = null,
  actions = null,
}: UsePageHeaderOptions) {
  const setHeader = usePageHeaderStore((s) => s.setHeader)

  useEffect(() => {
    setHeader({ title, actions })
    return () => setHeader(EMPTY_HEADER)
  }, [setHeader, title, actions])
}

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

interface PageHeaderState {
  title: ReactNode
  actions: ReactNode
}

interface PageHeaderContextValue extends PageHeaderState {
  setHeader: (state: PageHeaderState) => void
}

const EMPTY_HEADER: PageHeaderState = { title: null, actions: null }

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

/**
 * Holds the current page's title + actions so `TopNav` can render them.
 * Wraps the whole shell; individual route pages call `usePageHeader` to
 * publish their own title/actions into this context.
 */
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState>(EMPTY_HEADER)

  return (
    <PageHeaderContext.Provider value={{ ...header, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  )
}

function usePageHeaderContext() {
  const ctx = useContext(PageHeaderContext)
  if (!ctx) {
    throw new Error(
      "usePageHeaderContext must be used within a PageHeaderProvider"
    )
  }
  return ctx
}

/** Read-only access to the current header state; consumed by `TopNav`. */
export function usePageHeaderValue(): PageHeaderState {
  const { title, actions } = usePageHeaderContext()
  return { title, actions }
}

interface UsePageHeaderOptions {
  title?: ReactNode
  actions?: ReactNode
}

/**
 * Publishes `title`/`actions` into the shell's TopNav for the lifetime of
 * the calling component. Clears itself on unmount.
 */
export function usePageHeader({
  title = null,
  actions = null,
}: UsePageHeaderOptions) {
  const { setHeader } = usePageHeaderContext()

  useEffect(() => {
    setHeader({ title, actions })
    return () => setHeader(EMPTY_HEADER)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, actions])
}

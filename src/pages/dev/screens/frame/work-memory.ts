import * as React from "react"

// 사건 창 작업 상태 보관함(1회차 검수 — 「탭을 옮기면 문양 · 가중치 · 검색 이력 · 판정이 초기값으로 돌아감」).
// 사건 창 본문(S02–S07 내용)은 작업 탭을 바꿀 때마다 새로 그려진다. 그래서 작업 중인 값은 S01(사건관리 진열 페이지)이
// 들고 있는 보관함에 「범위(사건 · 이미지) + 칸 이름」으로 적어 두고, 다시 그릴 때 거기서 꺼낸다.
//   - 범위 = `<감정번호>|<이미지 번호>`(이미지별 작업 — 문양 · 가중치 · 검색 이력 · 확인대상 · 편집 이력) 또는 `<감정번호>`(사건 단위 — 판정)
//   - 보관함이 없으면(단독 진열 페이지) 보통 useState 와 똑같다
// 다른 탭이 같은 범위의 값을 읽을 때(검색 결과 탭이 문양 코드 탭 검색 이력을 읽는 등)는 `useWorkValue` · `readWork` 로 읽는다.

/** 보관함 — 키 `<범위>#<칸>` → 값 */
export type WorkStore = Map<string, unknown>

interface WorkScope {
  /** 보관함(S01 이 든다) */
  store: WorkStore
  /** 지금 범위(`<감정번호>|<이미지 번호>` 또는 `<감정번호>`) */
  scope: string
}

const WorkMemoryContext = React.createContext<WorkScope | null>(null)

/** 보관함 키 */
export function workKey(scope: string, field: string): string {
  return `${scope}#${field}`
}

/** 이미지별 범위 */
export function imageScope(aprthngNo: string, img: string | null): string {
  return `${aprthngNo}|${img ?? ""}`
}

/** 보관함에서 한 칸 읽기(없으면 undefined) — S01 처럼 보관함을 든 쪽이 직접 읽을 때 */
export function readWork<T>(store: WorkStore, scope: string, field: string): T | undefined {
  return store.get(workKey(scope, field)) as T | undefined
}

/** 보관함에 한 칸 쓰기 */
export function writeWork(store: WorkStore, scope: string, field: string, value: unknown): void {
  store.set(workKey(scope, field), value)
}

/** S01 이 사건 창 본문을 감싸 범위를 정한다 */
export function WorkMemoryProvider({ store, scope, children }: { store: WorkStore; scope: string; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ store, scope }), [store, scope])
  return React.createElement(WorkMemoryContext.Provider, { value }, children)
}

/** 지금 보관함 · 범위(없으면 null — 단독 진열) */
export function useWorkScope(): WorkScope | null {
  return React.useContext(WorkMemoryContext)
}

/**
 * 탭을 옮겨도 남는 상태. 보관함이 있으면 처음 값을 보관함에서 꺼내고, 바뀔 때마다 보관함에 적는다.
 * 보관함이 없으면 useState 그대로.
 */
export function useWorkState<T>(field: string, initial: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const ctx = React.useContext(WorkMemoryContext)
  const key = ctx ? workKey(ctx.scope, field) : null
  const [value, setValue] = React.useState<T>(() => {
    if (ctx && key !== null && ctx.store.has(key)) return ctx.store.get(key) as T
    return typeof initial === "function" ? (initial as () => T)() : initial
  })
  React.useEffect(() => {
    if (ctx && key !== null) ctx.store.set(key, value)
  }, [ctx, key, value])
  return [value, setValue]
}

/** 같은 범위의 다른 탭이 남긴 값 읽기(읽기만 — 그리는 순간의 값) */
export function useWorkValue<T>(field: string): T | undefined {
  const ctx = React.useContext(WorkMemoryContext)
  return ctx ? readWork<T>(ctx.store, ctx.scope, field) : undefined
}

/** 같은 범위의 다른 칸에 쓰기(예 정밀 대조 「확인대상」 → 결과 확인 탭이 읽음). 보관함이 없으면 아무것도 안 함 */
export function useWorkWriter(): (field: string, value: unknown) => void {
  const ctx = React.useContext(WorkMemoryContext)
  return React.useCallback(
    (field: string, value: unknown) => {
      if (ctx) writeWork(ctx.store, ctx.scope, field, value)
    },
    [ctx],
  )
}

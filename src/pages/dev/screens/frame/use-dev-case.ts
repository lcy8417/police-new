import { useSearchParams } from "react-router-dom"

/** `?case=` 값을 읽는다. 목록에 없거나 없으면 fallback. */
export function useDevCase<C extends string>(cases: readonly C[], fallback: C): C {
  const [params] = useSearchParams()
  const value = params.get("case")
  return cases.find((c) => c === value) ?? fallback
}

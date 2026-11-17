import * as React from "react"

/**
 * 순위 목록(스크롤 칸) 안에서 「지금 화면 + 아래 한 화면」에 든 카드 순위의 최댓값(지금까지 중 가장 큰 값 — 줄지 않음).
 * 이 순위까지의 카드 그림은 바로 받는다(`loading="eager"`) — 자동 스크롤 · 빠른 비교가 다음 화면에 닿기 전에 그림이 와 있게.
 * 나머지는 `loading="lazy"` 로 두어 화면 밖 그림이 화면 안 그림과 연결을 다투지 않게 한다(분석 보고서 B2).
 *
 * `rootMargin` 아래쪽 100% = 스크롤 칸 높이 한 번(퍼센트는 기준 칸 크기 기준). IntersectionObserver 가 없으면(테스트 환경) 0.
 * `watchKey` 가 바뀌면(카드가 붙음 · 보기 바뀜) 새 카드까지 다시 지켜본다.
 */
export function useAheadRank(listRef: React.RefObject<HTMLElement | null>, watchKey: string): number {
  const [upTo, setUpTo] = React.useState(0)
  React.useEffect(() => {
    const root = listRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        let max = 0
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const rank = Number((entry.target as HTMLElement).dataset.rank)
          if (Number.isFinite(rank) && rank > max) max = rank
        }
        if (max > 0) setUpTo((prev) => (max > prev ? max : prev))
      },
      { root, rootMargin: "0px 0px 100% 0px" },
    )
    root.querySelectorAll<HTMLElement>("[data-result-card]").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [listRef, watchKey])
  return upTo
}

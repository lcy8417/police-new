import * as React from "react"

import { shoeThumbUrl } from "./shoe-thumb"

/** 썸네일을 못 읽은 원본 주소(이 화면 동안 기억 — 같은 신발 카드를 다시 그려도 404 를 또 부르지 않게) */
const failedThumbs = new Set<string>()

/**
 * 작은 칸 그림의 주소: 썸네일이 있으면 썸네일, 없거나(404) 못 읽으면 원본(`src`)으로 저절로 바꾼다.
 * `enabled=false` 면 처음부터 원본(큰 칸 — 1 · 3개 보기).
 * 돌려준 `onError` 를 `<img onError>` 에 건다 — 원본까지 실패하면 그때는 아무것도 안 한다(예전과 같은 깨진 그림).
 */
export function useThumbSrc(src: string, enabled = true): { src: string; onError: () => void } {
  const thumb = enabled && !failedThumbs.has(src) ? shoeThumbUrl(src) : null
  const [failed, setFailed] = React.useState<string | null>(null)
  const useThumb = thumb !== null && failed !== src
  const onError = React.useCallback(() => {
    if (!useThumb) return
    failedThumbs.add(src)
    setFailed(src)
  }, [src, useThumb])
  return { src: useThumb ? thumb : src, onError }
}

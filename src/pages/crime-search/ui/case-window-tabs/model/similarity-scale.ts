// imageSearch 유사도를 위젯 규약(퍼센트 0~100)으로 맞춘다(docs/api-communication.md §2 — 응답은 퍼센트).
// 서버가 0~1 비율로 준 목록이 섞여 와도 지금 앱(RetrievalResultsGrid)처럼 퍼센트로 읽히게 한다.
// 한 목록 안에서 같은 척도를 쓰므로, 숫자로 읽히는 값이 모두 1 이하일 때만 ×100 한다(80% 와 0.8 을 섞어 읽지 않게).

/** 유사도 한 값을 숫자로 — 문자열도 허용, 숫자가 아니면 null */
function readNumber(value: number | string): number | null {
  const n = typeof value === "number" ? value : Number.parseFloat(value)
  return Number.isFinite(n) ? n : null
}

/** 목록이 0~1 비율 척도인가(숫자 값이 하나 이상이고 모두 1 이하) */
export function isRatioScale(values: readonly (number | string)[]): boolean {
  const nums = values.map(readNumber).filter((n): n is number => n !== null)
  return nums.length > 0 && nums.every((n) => n <= 1)
}

/** 목록 항목의 similarity 를 퍼센트로(비율 척도면 ×100, 아니면 그대로 — 숫자가 아닌 값도 그대로) */
export function toPercentList<T extends { similarity: number | string }>(items: readonly T[]): T[] {
  if (!isRatioScale(items.map((i) => i.similarity))) return [...items]
  return items.map((i) => {
    const n = readNumber(i.similarity)
    return n === null ? i : { ...i, similarity: Math.round(n * 10000) / 100 }
  })
}

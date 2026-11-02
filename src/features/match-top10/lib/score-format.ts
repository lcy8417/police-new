/**
 * SPEC-MATCH-TOP10-001 [WATCH]: `RetrievalResultsGrid`는 유사도를 `>1이면 /100`으로
 * 정규화한다(레거시 search API가 0~100 퍼센트를 주기 때문). 매칭 score는 코사인
 * 유사도 도메인(0~1)이라 이미 정규화된 값을 그대로 넘겨야 한다 — 이 파일이 그
 * 변환 지점을 명시적으로 드러내고, 두 스케일 규약이 조용히 충돌하지 않도록
 * 표시값을 직접 계산해 테스트로 고정한다.
 */

/**
 * 매칭 score(0~1 코사인 유사도)를 `RetrievalResultsGrid`와 동일한 표시 규칙으로
 * 백분율 정수로 변환한다. `RetrievalResultsGrid.parseSimilarity`의 `>1이면 /100`
 * 규칙을 재현하되, 매칭 score는 설계상 항상 <=1이므로 이 경로에서는 나눗셈이
 * 발생하지 않는다 — 그 사실 자체를 테스트로 고정해 두 컨벤션이 조용히 충돌하는
 * 회귀를 막는다.
 */
export function matchScoreToDisplayPercent(score: number): number {
  const normalized = score > 1 ? score / 100 : score;
  return Math.round(Math.max(0, Math.min(1, normalized)) * 100);
}

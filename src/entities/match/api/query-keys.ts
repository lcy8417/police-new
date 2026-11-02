/** TanStack Query 키 팩토리 — entities/alignment/api/query-keys.ts와 동일 패턴. */
export const matchTop10Keys = {
  all: ["match-top10"] as const,
  detail: (crimeNumber: string, modelNumber: string) =>
    [...matchTop10Keys.all, crimeNumber, modelNumber] as const,
};

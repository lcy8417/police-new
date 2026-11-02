/** TanStack Query 키 팩토리 — entities/alignment/api/query-keys.ts와 동일 패턴. */
export const matchTop10Keys = {
  all: ["match-top10"] as const,
  detail: (aprthngNo: string, ftwrId: string) =>
    [...matchTop10Keys.all, aprthngNo, ftwrId] as const,
};

/** TanStack Query key factory for the alignment entity. */
export const alignmentKeys = {
  detail: (aprthngNo: string, ftwrId: string) =>
    ["alignment", aprthngNo, ftwrId] as const,
  /** 같은 감정물의 직전 정렬(신발 무관) — 새 후보 프리필 소스. */
  latest: (aprthngNo: string) => ["alignment", aprthngNo, "latest"] as const,
};

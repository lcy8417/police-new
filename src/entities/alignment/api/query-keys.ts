/** TanStack Query key factory for the alignment entity. */
export const alignmentKeys = {
  detail: (crimeNumber: string, modelNumber: string) =>
    ["alignment", crimeNumber, modelNumber] as const,
  /** 같은 사건의 직전 정렬(모델 무관) — 새 후보 프리필 소스. */
  latest: (crimeNumber: string) => ["alignment", crimeNumber, "latest"] as const,
};

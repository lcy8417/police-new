/** TanStack Query key factory for the crime entity. */
export const crimeKeys = {
  list: () => ["crime", "list"] as const,
  detail: (aprthngNo: string) => ["crime", aprthngNo] as const,
  history: (aprthngNo: string, searchNo: string | number) =>
    ["crime", aprthngNo, "history", searchNo] as const,
};

/** TanStack Query key factory for the crime entity. */
export const crimeKeys = {
  list: () => ["crime", "list"] as const,
  detail: (crimeNumber: string) => ["crime", crimeNumber] as const,
  history: (crimeNumber: string, id: string | number) =>
    ["crime", crimeNumber, "history", id] as const,
};

/** TanStack Query key factory for the shoe entity. */
export const shoeKeys = {
  list: (page: number) => ["shoes", "list", page] as const,
  count: () => ["shoes", "count"] as const,
  detail: (modelNumber: string) => ["shoes", modelNumber] as const,
};

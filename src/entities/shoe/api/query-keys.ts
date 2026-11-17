import type { ShoeListFilters } from "../model/types";

/** TanStack Query key factory for the shoe entity. 무효화는 `["shoes"]` 하나로 전부. */
export const shoeKeys = {
  list: (page: number, filters?: ShoeListFilters) =>
    filters ? (["shoes", "list", page, filters] as const) : (["shoes", "list", page] as const),
  count: (filters?: ShoeListFilters) =>
    filters ? (["shoes", "count", filters] as const) : (["shoes", "count"] as const),
  stages: () => ["shoes", "stages"] as const,
  detail: (ftwrId: string) => ["shoes", ftwrId] as const,
};

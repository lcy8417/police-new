import { create } from "zustand";

import { insertPatternPath, type PatternZone } from "@/entities/pattern";

import { fetchCrimeList } from "../api/crime-api";
import type { Crime } from "./types";

const PATTERN_ZONES: readonly PatternZone[] = ["top", "mid", "bottom", "outline"];

/** Accepts a value or an updater function — matching React's setState contract,
 * so the 12 legacy `crimeDataContext` consumers keep working unchanged. */
type CrimeUpdater = Crime[] | ((prev: Crime[]) => Crime[]);

interface CrimeStore {
  crimeData: Crime[];
  registerFlag: unknown;
  setCrimeData: (updater: CrimeUpdater) => void;
  setRegisterFlag: (flag: unknown) => void;
  refetch: () => Promise<void>;
}

/**
 * Single source of truth for the working crime list. The legacy
 * `crimeDataContext` provider (App.jsx) is now a thin bridge that reads its
 * value from this store, so `.jsx` (context) and `.tsx` (store) code share one
 * source of truth until the last context consumer is migrated.
 */
export const useCrimeStore = create<CrimeStore>((set, get) => ({
  crimeData: [],
  registerFlag: [],

  setCrimeData: (updater) =>
    set((state) => ({
      crimeData:
        typeof updater === "function"
          ? updater(state.crimeData)
          : updater,
    })),

  // Preserves the legacy trigger API: setting the flag refetches, exactly like
  // the old `useEffect(readCrimeData, [registerFlag])` in App.jsx.
  setRegisterFlag: (flag) => {
    set({ registerFlag: flag });
    void get().refetch();
  },

  // Mirror of the old App.jsx effect: fetch the list, hydrate each pattern zone
  // to full asset paths, coerce image to a string.
  refetch: async () => {
    try {
      const data = await fetchCrimeList();
      const hydrated = data.map((item) => {
        const next: Crime = { ...item };
        for (const zone of PATTERN_ZONES) {
          next[zone] = (item[zone] ?? []).map((entry) =>
            insertPatternPath(entry)
          );
        }
        next.image = `${item.image}`;
        return next;
      });
      set({ crimeData: hydrated });
    } catch (error) {
      console.error("Error fetching crime data:", error);
    }
  },
}));

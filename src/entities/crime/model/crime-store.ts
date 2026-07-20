import { create } from "zustand";

import { insertPatternPath, type PatternZone } from "@/entities/pattern";

import { fetchCrimeList } from "../api/crime-api";
import type { Crime } from "./types";

const PATTERN_ZONES: readonly PatternZone[] = ["top", "mid", "bottom", "outline"];

/** Accepts a value or an updater function — matching React's setState contract,
 * so store consumers can update the list with the same ergonomics as setState. */
type CrimeUpdater = Crime[] | ((prev: Crime[]) => Crime[]);

interface CrimeStore {
  crimeData: Crime[];
  registerFlag: unknown;
  setCrimeData: (updater: CrimeUpdater) => void;
  setRegisterFlag: (flag: unknown) => void;
  refetch: () => Promise<void>;
}

/**
 * Single source of truth for the working crime list. Every screen — both the
 * `.jsx` legacy consumers and the `.tsx` redesign — subscribes to this store
 * directly via selectors; the former React Context bridge has been removed.
 */
// @MX:ANCHOR: [AUTO] useCrimeStore - 전역 사건 상태 단일 출처(Zustand), App.jsx/PatternItem.jsx/ShoeDetailContent/use-pattern-manager/CrimeDetailPage/RegisterStage 등에서 구독
// @MX:REASON: fan_in >= 3(레거시 .jsx + 신규 FSD 슬라이스 공존) — 유일한 crimeData 소스, Context 브리지 제거 완료로 이 store가 유일한 진입점
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

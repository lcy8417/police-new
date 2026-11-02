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
  /** 목록을 비운다 — 사건 조회 자격이 사라졌을 때(권한 회수 등). 진행 중인 `refetch` 결과도 버린다. */
  reset: () => void;
}

/**
 * `reset` 세대 번호. `refetch`는 출발 시점의 번호를 기억했다가, 응답이 왔을 때 번호가
 * 바뀌어 있으면(그 사이 `reset`됨) 결과를 버린다 — 권한이 회수된 뒤 늦게 도착한 목록이
 * 다시 채워지는 것을 막는다.
 */
let resetGeneration = 0;

/**
 * Single source of truth for the working crime list. Every screen — both the
 * `.jsx` legacy consumers and the `.tsx` redesign — subscribes to this store
 * directly via selectors; the former React Context bridge has been removed.
 */
// @MX:ANCHOR: [AUTO] useCrimeStore - 전역 사건 상태 단일 출처(Zustand), SessionProvider(초기 로딩·reset)/PatternItem.jsx/ShoeDetailContent/use-pattern-manager/CrimeDetailPage/RegisterStage 등에서 구독
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
    const generation = resetGeneration;
    try {
      const data = await fetchCrimeList();
      if (generation !== resetGeneration) return;
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

  reset: () => {
    resetGeneration += 1;
    set({ crimeData: [], registerFlag: [] });
  },
}));

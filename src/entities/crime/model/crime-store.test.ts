import { describe, it, expect, beforeEach, afterEach, afterAll, beforeAll } from "vitest";
import { http, HttpResponse } from "msw";

import { PATTERNS_ROOT } from "@/entities/pattern";

import { mswServer } from "@/test/msw-server";
import { useCrimeStore } from "./crime-store";
import type { Crime } from "./types";

const blank = (aprthngNo: string): Crime => ({
  aprthngNo,
  top: [],
  mid: [],
  bottom: [],
  outline: [],
});

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
beforeEach(() => useCrimeStore.setState({ crimeData: [], registerFlag: [] }));

describe("useCrimeStore — context bridge", () => {
  it("setCrimeData accepts a plain array (React-setState compatible)", () => {
    useCrimeStore.getState().setCrimeData([blank("1")]);
    expect(useCrimeStore.getState().crimeData).toHaveLength(1);
  });

  it("setCrimeData accepts an updater function, like the 12 legacy consumers use", () => {
    useCrimeStore.getState().setCrimeData([blank("1")]);
    useCrimeStore.getState().setCrimeData((prev) => [...prev, blank("2")]);
    expect(
      useCrimeStore.getState().crimeData.map((c) => c.aprthngNo)
    ).toEqual(["1", "2"]);
  });

  it("is a single source of truth: a context-style write is visible to store readers", () => {
    // Simulate a .jsx consumer writing through the bridged setter...
    useCrimeStore.getState().setCrimeData([blank("42")]);
    // ...and a .tsx reader seeing it via the store directly.
    expect(useCrimeStore.getState().crimeData[0].aprthngNo).toBe("42");
  });

  it("refetch hydrates pattern zones to full paths and coerces image", async () => {
    mswServer.use(
      http.get("*/crime", () =>
        HttpResponse.json([
          {
            aprthng_no: "05019-24-0017_5",
            apprsl_reqest_no: "05019-24-0017",
            pick_dt: "2024-01-29T05:31:00",
            rqest_grfc_nm: "서울경찰청",
            process_sttus: 0,
            image: "scene.png",
            top: [["무늬1", 0]],
            mid: [],
            bottom: [],
            // 서버는 SCAS 필수 플래그를 정수 1로 보낸다(설계서 §4-1).
            outline: [["원3", 1]],
          },
        ])
      )
    );

    await useCrimeStore.getState().refetch();
    const [row] = useCrimeStore.getState().crimeData;

    expect(row.aprthngNo).toBe("05019-24-0017_5"); // camelCased, 문자열 그대로
    expect(row.apprslReqestNo).toBe("05019-24-0017");
    expect(row.pickDt).toBe("2024-01-29T05:31:00");
    expect(row.rqestGrfcNm).toBe("서울경찰청");
    expect(row.processSttus).toBe(0);
    expect(row.top).toEqual([[`${PATTERNS_ROOT}무늬1.png`, 0]]); // hydrated + 0 kept
    expect(row.outline).toEqual([[`${PATTERNS_ROOT}원3.png`, 1]]);
    expect(row.image).toBe("scene.png");
  });
});

describe("useCrimeStore — reset(사건 조회 자격이 사라졌을 때)", () => {
  it("reset clears crime list", () => {
    useCrimeStore.getState().setCrimeData([blank("1"), blank("2")]);
    useCrimeStore.getState().reset();
    expect(useCrimeStore.getState().crimeData).toEqual([]);
  });

  it("reset 전에 출발한 목록 요청 결과는 버린다", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    mswServer.use(
      http.get("*/crime", async () => {
        await gate;
        return HttpResponse.json([{ aprthng_no: "늦은응답", top: [], mid: [], bottom: [], outline: [] }]);
      })
    );

    const inflight = useCrimeStore.getState().refetch();
    useCrimeStore.getState().reset();
    release();
    await inflight;

    expect(useCrimeStore.getState().crimeData).toEqual([]);
  });
});

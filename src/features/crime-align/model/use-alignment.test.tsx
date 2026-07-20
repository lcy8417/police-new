import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";

import { mswServer } from "@/test/msw-server";
import { useAlignment } from "./use-alignment";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

function renderUseAlignment(crimeNumber: string, modelNumber: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return renderHook(() => useAlignment({ crimeNumber, modelNumber }), { wrapper });
}

const RECT = { left: 0, top: 0, width: 100, height: 100 };
const NATURAL_WIDTH = 200; // scale = 2
const NATURAL_HEIGHT = 300;

const UNSET = { polygon: null, arrow: null, flipHorizontal: false };

describe("useAlignment — 밑창 템플릿 기본 제공(REQ-ALIGN-017, AC-ALIGN-026)", () => {
  it("미설정 (crime, shoe)에서 seedTemplate 호출 시 밑창 템플릿 폴리곤이 즉시 채워진다", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.polygon).toEqual([]);
    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));

    expect(result.current.polygon.length).toBeGreaterThanOrEqual(3);
    expect(result.current.drawMode).toBe("template");
    expect(result.current.canClosePolygon).toBe(true);
  });

  it("seedTemplate은 이미 정점이 있으면 재적용하지 않는다(멱등)", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));
    const first = result.current.polygon;
    act(() => result.current.seedTemplate(999, 999));
    expect(result.current.polygon).toEqual(first);
  });

  it("복원 우선(REQ-ALIGN-017) — 저장된 정렬이 있으면 템플릿이 아니라 저장본이 유지된다", async () => {
    mswServer.use(
      http.get("*/crime/A/alignment", () =>
        HttpResponse.json({
          polygon: [
            [10, 10],
            [50, 10],
            [50, 40],
          ],
          arrow: [
            [20, 20],
            [40, 30],
          ],
          flipHorizontal: false,
        })
      )
    );
    const { result } = renderUseAlignment("A", "Y");
    await waitFor(() => expect(result.current.phase).toBe("review"));

    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));

    // 템플릿으로 덮어써지지 않고 저장본이 그대로 유지된다.
    expect(result.current.polygon).toEqual([
      [10, 10],
      [50, 10],
      [50, 40],
    ]);
  });

  it("startFromScratch는 폴리곤을 비우고 scratch 모드로 전환한다(REQ-ALIGN-017 — 템플릿은 강제가 아니다)", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));
    expect(result.current.polygon.length).toBeGreaterThan(0);

    act(() => result.current.startFromScratch());
    expect(result.current.polygon).toEqual([]);
    expect(result.current.drawMode).toBe("scratch");

    // scratch 모드에서는 기존 클릭-추가 흐름이 여전히 동작한다.
    act(() => {
      result.current.addPoint(10, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 20, RECT, NATURAL_WIDTH);
    });
    expect(result.current.polygon).toHaveLength(3);
    expect(result.current.canClosePolygon).toBe(true);
  });

  it("template 모드에서는 addPoint(클릭 추가)가 무시된다 — 드래그로만 조정한다", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));
    const seeded = result.current.polygon;

    act(() => result.current.addPoint(5, 5, RECT, NATURAL_WIDTH));
    expect(result.current.polygon).toEqual(seeded); // 변화 없음
  });
});

describe("useAlignment — 드래그 미세 조정(REQ-ALIGN-018, AC-ALIGN-027)", () => {
  it("moveWholeShape는 폴리곤 전체를 평행 이동한다(형태 유지)", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startFromScratch());
    act(() => {
      result.current.addPoint(10, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 20, RECT, NATURAL_WIDTH);
    });
    const before = result.current.polygon;

    // 표시 좌표 델타 (5, -3) at scale=2 → 저장 좌표 델타 (10, -6).
    act(() => result.current.moveWholeShape(5, -3, NATURAL_WIDTH, RECT.width));

    expect(result.current.polygon).toEqual([
      [before[0][0] + 10, before[0][1] - 6],
      [before[1][0] + 10, before[1][1] - 6],
      [before[2][0] + 10, before[2][1] - 6],
    ]);
  });

  it("moveVertexAt은 지정한 정점만 이동하고 나머지는 불변이다", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startFromScratch());
    act(() => {
      result.current.addPoint(10, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 20, RECT, NATURAL_WIDTH);
    });
    const before = result.current.polygon;

    act(() => result.current.moveVertexAt(1, 50, 50, RECT, NATURAL_WIDTH));

    expect(result.current.polygon[0]).toEqual(before[0]);
    expect(result.current.polygon[2]).toEqual(before[2]);
    expect(result.current.polygon[1]).toEqual([100, 100]); // (50,50) at scale=2
  });

  it("review 단계에서는 드래그 조정이 무시된다", async () => {
    mswServer.use(
      http.get("*/crime/A/alignment", () =>
        HttpResponse.json({
          polygon: [
            [10, 10],
            [50, 10],
            [50, 40],
          ],
          arrow: [
            [20, 20],
            [40, 30],
          ],
          flipHorizontal: false,
        })
      )
    );
    const { result } = renderUseAlignment("A", "Y");
    await waitFor(() => expect(result.current.phase).toBe("review"));

    act(() => result.current.moveWholeShape(100, 100, NATURAL_WIDTH, RECT.width));
    expect(result.current.polygon).toEqual([
      [10, 10],
      [50, 10],
      [50, 40],
    ]);
  });
});

describe("useAlignment — 앞굽/뒤꿈치 명시 선택(REQ-ALIGN-019, AC-ALIGN-028)", () => {
  function drawClosedTriangle(result: { current: ReturnType<typeof useAlignment> }) {
    act(() => result.current.startFromScratch());
    act(() => {
      result.current.addPoint(10, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 20, RECT, NATURAL_WIDTH);
    });
    act(() => result.current.closePolygon());
  }

  it("arrowStep이 toe→heel→complete 순으로 전이한다", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    drawClosedTriangle(result);

    expect(result.current.phase).toBe("arrow");
    expect(result.current.arrowStep).toBe("toe");

    act(() => result.current.pickArrowPoint("toe", 5, 5, RECT, NATURAL_WIDTH));
    expect(result.current.toe).toEqual([10, 10]);
    expect(result.current.arrowStep).toBe("heel");
    expect(result.current.phase).toBe("arrow"); // 아직 미완료

    act(() => result.current.pickArrowPoint("heel", 15, 15, RECT, NATURAL_WIDTH));
    expect(result.current.heel).toEqual([30, 30]);
    expect(result.current.arrowStep).toBe("complete");
    expect(result.current.phase).toBe("review");
    expect(result.current.arrow).toEqual([
      [10, 10],
      [30, 30],
    ]);
  });

  it("clearArrowPoint(toe)는 앞굽만 재선택 대상으로 만들고, 뒤꿈치는 보존한다(개별 재선택)", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    drawClosedTriangle(result);

    act(() => result.current.pickArrowPoint("toe", 5, 5, RECT, NATURAL_WIDTH));
    act(() => result.current.pickArrowPoint("heel", 15, 15, RECT, NATURAL_WIDTH));
    expect(result.current.phase).toBe("review");

    act(() => result.current.clearArrowPoint("toe"));
    expect(result.current.toe).toBeNull();
    expect(result.current.heel).toEqual([30, 30]); // 보존
    expect(result.current.arrowStep).toBe("toe");
    expect(result.current.phase).toBe("arrow"); // 재선택 가능하도록 전환

    act(() => result.current.pickArrowPoint("toe", 1, 1, RECT, NATURAL_WIDTH));
    expect(result.current.toe).toEqual([2, 2]);
    expect(result.current.phase).toBe("review");
  });

  it("arrow 단계가 아니면 pickArrowPoint가 무시된다", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.startFromScratch());

    act(() => result.current.pickArrowPoint("toe", 5, 5, RECT, NATURAL_WIDTH));
    expect(result.current.toe).toBeNull();
  });
});

describe("useAlignment — 좌우 반전(REQ-ALIGN-020, H2 하중 단언)", () => {
  function drawCompleteAlignment(result: { current: ReturnType<typeof useAlignment> }) {
    act(() => result.current.startFromScratch());
    act(() => {
      result.current.addPoint(10, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 20, RECT, NATURAL_WIDTH);
    });
    act(() => result.current.closePolygon());
    act(() => result.current.pickArrowPoint("toe", 1, 1, RECT, NATURAL_WIDTH));
    act(() => result.current.pickArrowPoint("heel", 2, 2, RECT, NATURAL_WIDTH));
  }

  it("toggleFlip은 flipHorizontal만 바꾸고 polygon/arrow는 절대 건드리지 않는다(H2)", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    drawCompleteAlignment(result);

    const polygonBefore = result.current.polygon;
    const arrowBefore = result.current.arrow;
    expect(result.current.flipHorizontal).toBe(false);

    act(() => result.current.toggleFlip());

    expect(result.current.flipHorizontal).toBe(true);
    expect(result.current.polygon).toEqual(polygonBefore);
    expect(result.current.arrow).toEqual(arrowBefore);
  });

  it("H2(핵심): flip on/off로 각각 저장했을 때 전송 좌표가 완전히 동일하다 — 오직 불리언만 다르다", async () => {
    const capturedBodies: unknown[] = [];
    mswServer.use(
      http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)),
      http.post("*/crime/A/alignment", async ({ request }) => {
        const body = await request.json();
        capturedBodies.push(body);
        return HttpResponse.json(body as object);
      })
    );
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    drawCompleteAlignment(result);

    // flip off 상태로 저장.
    await act(async () => {
      await result.current.save();
    });

    // flip을 켜고 다시 저장 — 폴리곤/화살표는 손대지 않는다.
    act(() => result.current.toggleFlip());
    await act(async () => {
      await result.current.save();
    });

    expect(capturedBodies).toHaveLength(2);
    const [off, on] = capturedBodies as Array<{
      polygon: number[][];
      arrow: number[][];
      flipHorizontal: boolean;
    }>;
    expect(off.polygon).toEqual(on.polygon);
    expect(off.arrow).toEqual(on.arrow);
    expect(off.flipHorizontal).toBe(false);
    expect(on.flipHorizontal).toBe(true);
  });

  it("반전 상태를 저장·복원한다(REQ-ALIGN-020b)", async () => {
    mswServer.use(
      http.get("*/crime/A/alignment", () =>
        HttpResponse.json({
          polygon: [
            [10, 10],
            [50, 10],
            [50, 40],
          ],
          arrow: [
            [20, 20],
            [40, 30],
          ],
          flipHorizontal: true,
        })
      )
    );
    const { result } = renderUseAlignment("A", "Y");
    await waitFor(() => expect(result.current.phase).toBe("review"));
    expect(result.current.flipHorizontal).toBe(true);
  });
});

describe("useAlignment — 저장/복원/재설정/쌍 격리(기존 계약 무변경)", () => {
  it("초기 phase는 polygon이고 정렬 미설정 상태다", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.phase).toBe("polygon");
    expect(result.current.isAligned).toBe(false);
  });

  it("save()는 폴리곤+화살표+flipHorizontal을 UPSERT 요청으로 전송하고 isAligned를 true로 만든다", async () => {
    let capturedBody: unknown;
    mswServer.use(
      http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)),
      http.post("*/crime/A/alignment", async ({ request }) => {
        capturedBody = await request.json();
        const body = capturedBody as { polygon: number[][]; arrow: number[][]; flipHorizontal: boolean };
        return HttpResponse.json({ ...body });
      })
    );
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startFromScratch());
    act(() => {
      result.current.addPoint(10, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 20, RECT, NATURAL_WIDTH);
    });
    act(() => result.current.closePolygon());
    act(() => result.current.pickArrowPoint("toe", 1, 1, RECT, NATURAL_WIDTH));
    act(() => result.current.pickArrowPoint("heel", 2, 2, RECT, NATURAL_WIDTH));

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.isAligned).toBe(true);
    expect(capturedBody).toEqual({
      polygon: [
        [20, 20],
        [40, 20],
        [40, 40],
      ],
      arrow: [
        [2, 2],
        [4, 4],
      ],
      flipHorizontal: false,
    });
  });

  it("reset()은 폴리곤/화살표/단계/모드를 초기화한다(재설정, REQ-ALIGN-009)", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startFromScratch());
    act(() => {
      result.current.addPoint(10, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 10, RECT, NATURAL_WIDTH);
      result.current.addPoint(20, 20, RECT, NATURAL_WIDTH);
    });
    act(() => result.current.reset());

    expect(result.current.polygon).toEqual([]);
    expect(result.current.toe).toBeNull();
    expect(result.current.heel).toBeNull();
    expect(result.current.phase).toBe("polygon");
    expect(result.current.drawMode).toBe("template");
  });

  it("서버 조회 결과로 폴리곤·화살표를 복원하고 review 단계로 진입한다(REQ-ALIGN-008)", async () => {
    mswServer.use(
      http.get("*/crime/A/alignment", () =>
        HttpResponse.json({
          polygon: [
            [10, 10],
            [50, 10],
            [50, 40],
          ],
          arrow: [
            [20, 20],
            [40, 30],
          ],
          flipHorizontal: false,
        })
      )
    );

    const { result } = renderUseAlignment("A", "Y");

    await waitFor(() => expect(result.current.phase).toBe("review"));
    expect(result.current.polygon).toEqual([
      [10, 10],
      [50, 10],
      [50, 40],
    ]);
    expect(result.current.arrow).toEqual([
      [20, 20],
      [40, 30],
    ]);
    expect(result.current.isAligned).toBe(true);
  });

  it("crimeNumber/modelNumber마다 독립적인 쿼리 키로 조회한다(AC-ALIGN-007)", async () => {
    mswServer.use(
      http.get("*/crime/A/alignment", ({ request }) => {
        const url = new URL(request.url);
        const modelNumber = url.searchParams.get("model_number");
        if (modelNumber === "X") {
          return HttpResponse.json({
            polygon: [
              [1, 1],
              [2, 1],
              [2, 2],
            ],
            arrow: [
              [1, 1],
              [2, 2],
            ],
            flipHorizontal: false,
          });
        }
        return HttpResponse.json(UNSET);
      })
    );

    const { result: resultX } = renderUseAlignment("A", "X");
    const { result: resultZ } = renderUseAlignment("A", "Z");

    await waitFor(() => expect(resultX.current.isAligned).toBe(true));
    await waitFor(() => expect(resultZ.current.isLoading).toBe(false));
    expect(resultZ.current.isAligned).toBe(false);
  });
});

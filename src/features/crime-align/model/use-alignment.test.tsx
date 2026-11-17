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

function renderUseAlignment(aprthngNo: string, ftwrId: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return renderHook(() => useAlignment({ aprthngNo, ftwrId }), { wrapper });
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

  it("템플릿 틀(닫힌 다각형)에서는 「다음: 방향 지정」 없이 바로 앞굽 · 뒤꿈치를 찍어 review 로 간다(스모크 4단계 결함)", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));
    await waitFor(() => expect(result.current.drawMode).toBe("template"));
    expect(result.current.phase).toBe("polygon");

    act(() => result.current.pickArrowPoint("toe", 5, 5, RECT, NATURAL_WIDTH));
    expect(result.current.toe).toEqual([10, 10]);
    expect(result.current.phase).toBe("arrow");
    act(() => result.current.pickArrowPoint("heel", 15, 15, RECT, NATURAL_WIDTH));
    expect(result.current.phase).toBe("review");
    expect(result.current.canSave).toBe(true);
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

  it("aprthngNo/ftwrId마다 독립적인 쿼리 키로 조회한다(AC-ALIGN-007)", async () => {
    mswServer.use(
      http.get("*/crime/A/alignment", ({ request }) => {
        const url = new URL(request.url);
        const ftwrId = url.searchParams.get("ftwr_id");
        if (ftwrId === "X") {
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

describe("useAlignment — 직전 정렬 이어받기와 쓰기 권한([검수])", () => {
  const LATEST = { ftwrId: "A1", polygon: [[1, 1], [9, 1], [9, 9]], arrow: [[5, 1], [5, 9]], flipHorizontal: false };

  function serve(posts: unknown[]) {
    mswServer.use(
      http.get("*/crime/:no/alignment/latest", () => HttpResponse.json(LATEST)),
      http.get("*/crime/:no/alignment", () => HttpResponse.json(UNSET)),
      http.post("*/crime/:no/alignment", async ({ request }) => {
        posts.push(await request.json());
        return HttpResponse.json({ ok: true });
      })
    );
  }

  it("쓰기 권한이 있으면 이어받은 정렬을 이 쌍으로 저장한다(예전 동작)", async () => {
    const posts: unknown[] = [];
    serve(posts);
    const { result } = renderUseAlignment("C-1_1", "B2");
    await waitFor(() => expect(result.current.phase).toBe("review"));
    await waitFor(() => expect(posts).toHaveLength(1));
  });

  it("보기 전용(canPersist=false)이면 화면에만 채우고 저장(POST)은 보내지 않는다 — 403 오류 알림 없음", async () => {
    const posts: unknown[] = [];
    serve(posts);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useAlignment({ aprthngNo: "C-1_1", ftwrId: "B2", canPersist: false }), { wrapper });
    await waitFor(() => expect(result.current.phase).toBe("review"));
    await new Promise((r) => setTimeout(r, 50));
    expect(posts).toHaveLength(0);
  });
});

describe("useAlignment — 판 안 정렬 지정(11/17 「폴리곤 치기 좀 쉽게」 · 「정렬 설정 누르면 저기서 바로」)", () => {
  const SAVED = {
    polygon: [
      [10, 10],
      [50, 10],
      [50, 50],
    ],
    arrow: [
      [20, 20],
      [30, 40],
    ],
    flipHorizontal: false,
  };

  it("사각형: 끈 두 모서리(클릭 좌표)를 저장 좌표 4점으로 — 이미지 밖은 clamp, 그린 뒤 누르면 바로 앞굽", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));
    act(() => result.current.startRect());
    expect(result.current.drawMode).toBe("rect");
    expect(result.current.polygon).toEqual([]);

    // 표시 (40,60) → (10,-5): 저장 = ×2, y 는 0 으로 clamp
    act(() => result.current.setRectangle(40, 60, 10, -5, RECT, NATURAL_WIDTH));
    expect(result.current.polygon).toEqual([
      [20, 0],
      [80, 0],
      [80, 120],
      [20, 120],
    ]);
    expect(result.current.canClosePolygon).toBe(true);
    act(() => result.current.pickArrowPoint("toe", 25, 30, RECT, NATURAL_WIDTH));
    expect(result.current.toe).toEqual([50, 60]);
    expect(result.current.phase).toBe("arrow");
  });

  it("사각형 모드가 아니면 setRectangle 은 무시", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(UNSET)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.startFromScratch());
    act(() => result.current.setRectangle(0, 0, 10, 10, RECT, NATURAL_WIDTH));
    expect(result.current.polygon).toEqual([]);
  });

  it("dragVertex · dragShape 는 저장 대기(review)에서도 고친다 — 반전 미리보기 중에는 잠김", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(SAVED)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.phase).toBe("review"));
    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));

    act(() => result.current.dragVertex(0, 5, 5, RECT, NATURAL_WIDTH));
    expect(result.current.polygon[0]).toEqual([10, 10]);
    act(() => result.current.dragVertex(0, 2, 3, RECT, NATURAL_WIDTH));
    expect(result.current.polygon[0]).toEqual([4, 6]);
    act(() => result.current.dragShape(1, 1, NATURAL_WIDTH, RECT.width));
    expect(result.current.polygon[1]).toEqual([52, 12]);

    act(() => result.current.toggleFlip());
    act(() => result.current.dragVertex(0, 40, 40, RECT, NATURAL_WIDTH));
    expect(result.current.polygon[0]).toEqual([6, 8]);
  });

  it("clearArrow = 방향 다시(폴리곤 유지), restart = 지금 방식으로 처음부터(방향도), discard = 저장본으로", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(SAVED)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.phase).toBe("review"));
    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));

    act(() => result.current.clearArrow());
    expect(result.current.arrow).toEqual([]);
    expect(result.current.phase).toBe("arrow");
    expect(result.current.polygon).toHaveLength(3);

    act(() => result.current.dragVertex(0, 1, 1, RECT, NATURAL_WIDTH));
    act(() => result.current.discard());
    expect(result.current.polygon).toEqual(SAVED.polygon);
    expect(result.current.arrow).toEqual(SAVED.arrow);
    expect(result.current.phase).toBe("review");

    act(() => result.current.startFromScratch());
    act(() => result.current.addPoint(10, 10, RECT, NATURAL_WIDTH));
    act(() => result.current.restart());
    expect(result.current.drawMode).toBe("scratch");
    expect(result.current.polygon).toEqual([]);
    expect(result.current.arrow).toEqual([]);
    expect(result.current.phase).toBe("polygon");
  });

  it("startTemplate 은 저장본이 있어도 밑창 틀을 바로 놓는다(사람이 고른 것) — 이미지 크기를 알기 전에는 아무것도", async () => {
    mswServer.use(http.get("*/crime/A/alignment", () => HttpResponse.json(SAVED)));
    const { result } = renderUseAlignment("A", "X");
    await waitFor(() => expect(result.current.phase).toBe("review"));
    act(() => result.current.startTemplate());
    expect(result.current.polygon).toEqual(SAVED.polygon);
    act(() => result.current.seedTemplate(NATURAL_WIDTH, NATURAL_HEIGHT));
    act(() => result.current.startTemplate());
    expect(result.current.drawMode).toBe("template");
    expect(result.current.polygon.length).toBeGreaterThan(3);
    expect(result.current.phase).toBe("review"); // 방향은 그대로
  });
});

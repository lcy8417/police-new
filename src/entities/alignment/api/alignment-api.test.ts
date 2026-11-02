import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { fetchAlignment, saveAlignment } from "./alignment-api";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe("fetchAlignment (GET /crime/:crimeNumber/alignment)", () => {
  it("passes model_number as a query param and returns polygon/arrow/flipHorizontal as-is", async () => {
    let capturedUrl = "";
    mswServer.use(
      http.get("*/crime/2024-001/alignment", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
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
        });
      })
    );

    const result = await fetchAlignment({ crimeNumber: "2024-001", modelNumber: "SHOE-1" });

    expect(capturedUrl).toContain("model_number=SHOE-1");
    expect(result).toEqual({
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
    });
  });

  it("returns null polygon/arrow when unset", async () => {
    mswServer.use(
      http.get("*/crime/2024-002/alignment", () =>
        HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false })
      )
    );

    const result = await fetchAlignment({ crimeNumber: "2024-002", modelNumber: "SHOE-2" });

    expect(result).toEqual({ polygon: null, arrow: null, flipHorizontal: false });
  });
});

describe("saveAlignment (POST /crime/:crimeNumber/alignment)", () => {
  it("sends polygon/arrow/flipHorizontal as the body and model_number as a query param", async () => {
    let capturedUrl = "";
    let capturedBody: unknown;
    mswServer.use(
      http.post("*/crime/2024-001/alignment", async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
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
      })
    );

    const result = await saveAlignment({
      crimeNumber: "2024-001",
      modelNumber: "SHOE-1",
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

    expect(capturedUrl).toContain("model_number=SHOE-1");
    expect(capturedBody).toEqual({
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
    expect(result.polygon).toEqual([
      [1, 1],
      [2, 1],
      [2, 2],
    ]);
  });

  it("H2(하중 단언): flipHorizontal on/off 사이에 polygon/arrow 좌표가 바이트 단위로 동일하다 — 오직 불리언만 다르다", async () => {
    const capturedBodies: unknown[] = [];
    mswServer.use(
      http.post("*/crime/2024-005/alignment", async ({ request }) => {
        const body = await request.json();
        capturedBodies.push(body);
        return HttpResponse.json(body as object);
      })
    );

    const polygon: [number, number][] = [
      [10.5, 20.25],
      [30.125, 40],
      [15, 60.75],
    ];
    const arrow: [number, number][] = [
      [12, 22],
      [18, 58],
    ];

    await saveAlignment({
      crimeNumber: "2024-005",
      modelNumber: "SHOE-5",
      polygon,
      arrow,
      flipHorizontal: false,
    });
    await saveAlignment({
      crimeNumber: "2024-005",
      modelNumber: "SHOE-5",
      polygon,
      arrow,
      flipHorizontal: true,
    });

    expect(capturedBodies).toHaveLength(2);
    const [off, on] = capturedBodies as Array<{
      polygon: unknown;
      arrow: unknown;
      flipHorizontal: boolean;
    }>;
    // 좌표는 완전히 동일 — 오직 flipHorizontal 불리언만 달라야 한다(이중 반전 방지).
    expect(off.polygon).toEqual(on.polygon);
    expect(off.arrow).toEqual(on.arrow);
    expect(off.flipHorizontal).toBe(false);
    expect(on.flipHorizontal).toBe(true);
  });
});

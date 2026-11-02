import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { fetchMatchTop10 } from "./match-api";
import { MatchGateError } from "../model/types";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe("fetchMatchTop10 (POST /crime/:crimeNumber/match_top10)", () => {
  it("passes model_number as a query param and returns matches as-is", async () => {
    let capturedUrl = "";
    mswServer.use(
      http.post("*/crime/2024-001/match_top10", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          matches: [
            {
              fx: 100.5,
              fy: 200.1,
              sx: 50.2,
              sy: 60.3,
              score: 0.72,
              box: { cx: 100.5, cy: 200.1, size: 96 },
              box_image: "data:image/png;base64,AAA",
            },
          ],
          crime_number: "2024-001",
          model_number: "SHOE-1",
        });
      })
    );

    const result = await fetchMatchTop10({ crimeNumber: "2024-001", modelNumber: "SHOE-1" });

    expect(capturedUrl).toContain("model_number=SHOE-1");
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].score).toBe(0.72);
    expect(result.matches[0].box).toEqual({ cx: 100.5, cy: 200.1, size: 96 });
  });

  it("throws MatchGateError with the parsed detail on 409 ALIGNMENT_NOT_SET", async () => {
    mswServer.use(
      http.post("*/crime/2024-002/match_top10", () =>
        HttpResponse.json(
          {
            detail: {
              code: "ALIGNMENT_NOT_SET",
              crime_number: "2024-002",
              model_number: "SHOE-2",
            },
          },
          { status: 409 }
        )
      )
    );

    await expect(
      fetchMatchTop10({ crimeNumber: "2024-002", modelNumber: "SHOE-2" })
    ).rejects.toThrow(MatchGateError);
  });

  it("propagates COORDINATE_SPACE_MISMATCH without swallowing it (regression: [CORRECTION])", async () => {
    mswServer.use(
      http.post("*/crime/2024-003/match_top10", () =>
        HttpResponse.json(
          {
            detail: {
              code: "COORDINATE_SPACE_MISMATCH",
              crime_number: "2024-003",
              reason: "outline_scene_size_mismatch",
            },
          },
          { status: 409 }
        )
      )
    );

    try {
      await fetchMatchTop10({ crimeNumber: "2024-003", modelNumber: "SHOE-3" });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MatchGateError);
      expect((err as InstanceType<typeof MatchGateError>).detail.code).toBe(
        "COORDINATE_SPACE_MISMATCH"
      );
    }
  });

  it("distinguishes all four gate codes by exact string match", async () => {
    const codes = [
      "ALIGNMENT_NOT_SET",
      "OUTLINE_GENERATION_FAILED",
      "SHOE_BINARY_NOT_AVAILABLE",
      "COORDINATE_SPACE_MISMATCH",
    ] as const;

    for (const code of codes) {
      mswServer.use(
        http.post("*/crime/2024-004/match_top10", () =>
          HttpResponse.json({ detail: { code, crime_number: "2024-004" } }, { status: 409 })
        )
      );
      try {
        await fetchMatchTop10({ crimeNumber: "2024-004", modelNumber: "SHOE-4" });
        expect.fail("should have thrown");
      } catch (err) {
        expect((err as InstanceType<typeof MatchGateError>).detail.code).toBe(code);
      }
    }
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { fetchMatchTop10 } from "./match-api";
import { MatchGateError } from "../model/types";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe("fetchMatchTop10 (POST /crime/:aprthngNo/match_top10)", () => {
  it("passes ftwr_id as a query param and returns matches + aprthng_no/ftwr_id as-is", async () => {
    let capturedUrl = "";
    mswServer.use(
      http.post("*/crime/05019-24-0017_5/match_top10", ({ request }) => {
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
          aprthng_no: "05019-24-0017_5",
          ftwr_id: "00758",
        });
      })
    );

    const result = await fetchMatchTop10({ aprthngNo: "05019-24-0017_5", ftwrId: "00758" });

    expect(capturedUrl).toContain("ftwr_id=00758");
    expect(capturedUrl).not.toContain("model_number");
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].score).toBe(0.72);
    expect(result.matches[0].box).toEqual({ cx: 100.5, cy: 200.1, size: 96 });
    expect(result.aprthng_no).toBe("05019-24-0017_5");
    expect(result.ftwr_id).toBe("00758");
  });

  it("throws MatchGateError with the parsed detail on 409 ALIGNMENT_NOT_SET", async () => {
    mswServer.use(
      http.post("*/crime/2024-002_1/match_top10", () =>
        HttpResponse.json(
          {
            detail: {
              code: "ALIGNMENT_NOT_SET",
              aprthng_no: "2024-002_1",
              ftwr_id: "SHOE-2",
            },
          },
          { status: 409 }
        )
      )
    );

    try {
      await fetchMatchTop10({ aprthngNo: "2024-002_1", ftwrId: "SHOE-2" });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MatchGateError);
      const { detail } = err as InstanceType<typeof MatchGateError>;
      expect(detail.aprthng_no).toBe("2024-002_1");
      expect(detail.ftwr_id).toBe("SHOE-2");
    }
  });

  it("propagates COORDINATE_SPACE_MISMATCH without swallowing it (regression: [CORRECTION])", async () => {
    mswServer.use(
      http.post("*/crime/2024-003_1/match_top10", () =>
        HttpResponse.json(
          {
            detail: {
              code: "COORDINATE_SPACE_MISMATCH",
              aprthng_no: "2024-003_1",
              reason: "outline_scene_size_mismatch",
            },
          },
          { status: 409 }
        )
      )
    );

    try {
      await fetchMatchTop10({ aprthngNo: "2024-003_1", ftwrId: "SHOE-3" });
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
        http.post("*/crime/2024-004_1/match_top10", () =>
          HttpResponse.json({ detail: { code, aprthng_no: "2024-004_1" } }, { status: 409 })
        )
      );
      try {
        await fetchMatchTop10({ aprthngNo: "2024-004_1", ftwrId: "SHOE-4" });
        expect.fail("should have thrown");
      } catch (err) {
        expect((err as InstanceType<typeof MatchGateError>).detail.code).toBe(code);
      }
    }
  });
});

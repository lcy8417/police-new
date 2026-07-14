import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { PATTERNS_ROOT } from "@/entities/pattern";
import {
  fetchCrimeHistory,
  fetchCrimeList,
  putCrimePatterns,
  registerCrime,
  saveCrimeEditImage,
  saveCrimeHistory,
} from "./crime-api";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe("registerCrime (POST /crime/register)", () => {
  it("sends the legacy mixed body with the data-URL prefix stripped from image", async () => {
    let captured: unknown;
    mswServer.use(
      http.post("*/crime/register", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await registerCrime({
      image: "data:image/png;base64,AAAA",
      crimeNumber: "2024-001",
      imageNumber: "IMG-01",
      crimeName: "절도",
      findTime: "2024-01-01T00:00:00",
      requestOffice: "서울청",
      findMethod: "현장감식",
    });

    expect(captured).toEqual({
      image: "AAAA",
      crimeNumber: "2024-001",
      imageNumber: "IMG-01",
      crimeName: "절도",
      findTime: "2024-01-01T00:00:00",
      requestOffice: "서울청",
      findMethod: "현장감식",
    });
  });
});

describe("putCrimePatterns (PUT /crime/:crimeNumber)", () => {
  it("strips every zone to bare names, passing the 0 sentinel through unchanged", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/2024-001", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await putCrimePatterns("2024-001", {
      top: [
        [`${PATTERNS_ROOT}무늬1.png`, 0],
        [`${PATTERNS_ROOT}무늬2.png`, true],
      ],
      mid: [],
      bottom: [],
      outline: [[`${PATTERNS_ROOT}원3.png`, false]],
    });

    expect(captured).toEqual({
      top: [
        ["무늬1", 0],
        ["무늬2", true],
      ],
      mid: [],
      bottom: [],
      outline: [["원3", false]],
    });
  });
});

describe("saveCrimeHistory (POST /crime/:crimeNumber)", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("builds the full history-save body: KST registerTime, raw image passthrough, split editImage, parsed ranking", async () => {
    let captured: unknown;
    mswServer.use(
      http.post("*/crime/2024-001", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await saveCrimeHistory({
      crimeNumber: "2024-001",
      currentCrimeData: {
        crimeNumber: "2024-001",
        image: "data:image/png;base64,RAWIMAGE",
        editImage: "data:image/png;base64,EDITEDBASE64==",
        top: [[`${PATTERNS_ROOT}무늬1.png`, 0]],
        mid: [],
        bottom: [],
        outline: [],
      },
      ranking: "3",
      modelNumber: "SHOE-99",
    });

    expect(captured).toEqual({
      top: [["무늬1", 0]],
      mid: [],
      bottom: [],
      outline: [],
      crimeNumber: "2024-001",
      registerTime: "2024-06-15T19:00:00.000+09:00",
      // NOT stripped/split — fetchHistorySave passes currentCrimeData.image through as-is.
      image: "data:image/png;base64,RAWIMAGE",
      ranking: 3,
      editImage: "EDITEDBASE64==",
      matchingShoes: "SHOE-99",
    });
  });

  it("defaults ranking to 0 and editImage to null when absent", async () => {
    let captured: unknown;
    mswServer.use(
      http.post("*/crime/2024-002", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await saveCrimeHistory({
      crimeNumber: "2024-002",
      currentCrimeData: {
        crimeNumber: "2024-002",
        image: null,
        editImage: null,
        top: [],
        mid: [],
        bottom: [],
        outline: [],
      },
    });

    expect(captured).toEqual({
      top: [],
      mid: [],
      bottom: [],
      outline: [],
      crimeNumber: "2024-002",
      registerTime: "2024-06-15T19:00:00.000+09:00",
      image: null,
      ranking: 0,
      editImage: null,
      matchingShoes: null,
    });
  });
});

describe("saveCrimeEditImage (PUT /crime/edit_image/:crimeNumber)", () => {
  it("splits a data URL down to its base64 payload", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/edit_image/2024-001", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await saveCrimeEditImage({
      crimeNumber: "2024-001",
      scrollState: { image: "data:image/png;base64,EDITBASE64==" },
    });

    expect(captured).toEqual({ image: "EDITBASE64==" });
  });

  it("nulls out only a missing image", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/edit_image/2024-003", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await saveCrimeEditImage({
      crimeNumber: "2024-003",
      scrollState: { image: null },
    });

    expect(captured).toEqual({ image: null });
  });

  it("passes a prefix-less raw base64 image through unchanged (백엔드는 string 요구 — null 금지)", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/edit_image/2024-004", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await saveCrimeEditImage({
      crimeNumber: "2024-004",
      scrollState: { image: "RAWBASE64==" },
    });

    expect(captured).toEqual({ image: "RAWBASE64==" });
  });
});

describe("fetchCrimeList (GET /crime)", () => {
  it("camelCases the snake_case DTO list without hydrating pattern paths", async () => {
    mswServer.use(
      http.get("*/crime", () =>
        HttpResponse.json([
          {
            id: 1,
            crime_number: "2024-001",
            image: "data:image/png;base64,AAAA",
            edit_image: null,
            top: [["무늬1", 0]],
            mid: [],
            bottom: [],
            outline: [],
            ranking: 0,
            matching_shoes: null,
            register_time: "2024-06-15T19:00:00.000+09:00",
          },
        ])
      )
    );

    const result = await fetchCrimeList();

    expect(result).toEqual([
      {
        id: 1,
        crimeNumber: "2024-001",
        image: "data:image/png;base64,AAAA",
        editImage: null,
        top: [["무늬1", 0]], // bare names — fetchCrimeData never hydrates paths
        mid: [],
        bottom: [],
        outline: [],
        ranking: 0,
        matchingShoes: null,
        registerTime: "2024-06-15T19:00:00.000+09:00",
      },
    ]);
  });
});

describe("fetchCrimeHistory (GET /crime/history/:id)", () => {
  it("hydrates pattern paths to full asset URLs, then camelCases the rest", async () => {
    mswServer.use(
      http.get("*/crime/history/42", () =>
        HttpResponse.json({
          id: 42,
          crime_number: "2024-001",
          image: "data:image/png;base64,AAAA",
          edit_image: "data:image/png;base64,BBBB",
          top: [["무늬1", 0]],
          mid: [["선2", true]],
          bottom: [],
          outline: [],
          ranking: 1,
          matching_shoes: "SHOE-1",
          register_time: "2024-06-15T19:00:00.000+09:00",
        })
      )
    );

    const result = await fetchCrimeHistory(42);

    expect(result).toEqual({
      id: 42,
      crimeNumber: "2024-001",
      image: "data:image/png;base64,AAAA",
      editImage: "data:image/png;base64,BBBB",
      top: [[`${PATTERNS_ROOT}무늬1.png`, 0]],
      mid: [[`${PATTERNS_ROOT}선2.png`, true]],
      bottom: [],
      outline: [],
      ranking: 1,
      matchingShoes: "SHOE-1",
      registerTime: "2024-06-15T19:00:00.000+09:00",
    });
  });
});

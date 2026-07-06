import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { PATTERNS_ROOT } from "@/entities/pattern";
import { fetchShoeDetail, fetchShoesList, updateShoe } from "./shoe-api";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe("fetchShoesList (GET /shoes?page=N)", () => {
  it("camelCases the snake_case DTO page without hydrating pattern paths", async () => {
    mswServer.use(
      http.get("*/shoes", ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");
        expect(page).toBe("2");
        return HttpResponse.json([
          {
            id: 1,
            model_number: "SHOE-1",
            find_location: "서울",
            manufacturer: "나이키",
            find_year: 2023,
            emblem: "스우시",
            image: "data:image/png;base64,AAAA",
            top: ["무늬1"],
            mid: [],
            bottom: [],
            outline: [],
          },
        ]);
      })
    );

    const result = await fetchShoesList(2);

    expect(result).toEqual([
      {
        id: 1,
        modelNumber: "SHOE-1",
        findLocation: "서울",
        manufacturer: "나이키",
        findYear: 2023,
        emblem: "스우시",
        image: "data:image/png;base64,AAAA",
        top: ["무늬1"], // bare names — fetchShoesData never hydrates paths
        mid: [],
        bottom: [],
        outline: [],
      },
    ]);
  });

  it("defaults to page 0 when called with no arguments", async () => {
    mswServer.use(
      http.get("*/shoes", ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");
        expect(page).toBe("0");
        return HttpResponse.json([]);
      })
    );

    const result = await fetchShoesList();

    expect(result).toEqual([]);
  });
});

describe("fetchShoeDetail (GET /shoes/:modelNumber)", () => {
  it("camelCases the snake_case DTO without hydrating pattern paths", async () => {
    mswServer.use(
      http.get("*/shoes/SHOE-1", () =>
        HttpResponse.json({
          id: 1,
          model_number: "SHOE-1",
          find_location: "서울",
          manufacturer: "나이키",
          find_year: 2023,
          emblem: "스우시",
          image: "data:image/png;base64,AAAA",
          top: ["무늬1"],
          mid: ["선2"],
          bottom: [],
          outline: [],
        })
      )
    );

    const result = await fetchShoeDetail("SHOE-1");

    expect(result).toEqual({
      id: 1,
      modelNumber: "SHOE-1",
      findLocation: "서울",
      manufacturer: "나이키",
      findYear: 2023,
      emblem: "스우시",
      image: "data:image/png;base64,AAAA",
      top: ["무늬1"],
      mid: ["선2"],
      bottom: [],
      outline: [],
    });
  });
});

describe("updateShoe (PUT /shoes/:modelNumber)", () => {
  it("drops image, strips every pattern zone to bare-name strings, and keeps other fields camelCase", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/shoes/SHOE-1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({
          model_number: "SHOE-1",
          top: ["무늬1"],
          mid: [],
          bottom: [],
          outline: [],
        });
      })
    );

    await updateShoe({
      modelNumber: "SHOE-1",
      body: {
        id: 1,
        modelNumber: "SHOE-1",
        findLocation: "서울",
        manufacturer: "나이키",
        findYear: 2023,
        emblem: "스우시",
        // hydrated full asset paths — as they'd appear in ShoesEdit.jsx's live state
        image: "data:image/png;base64,DROPPEDME",
        top: [`${PATTERNS_ROOT}무늬1.png`, `${PATTERNS_ROOT}무늬2.png`],
        mid: [],
        bottom: [],
        outline: [`${PATTERNS_ROOT}원3.png`],
      },
    });

    // Golden shape: `image` is ABSENT (dropped, never sent); patterns are
    // bare-name strings (shoe patterns are strings, not [path, essential]
    // tuples, so stripPatternPath's string branch applies); other fields
    // pass through camelCase, unconverted.
    expect(captured).toEqual({
      id: 1,
      modelNumber: "SHOE-1",
      findLocation: "서울",
      manufacturer: "나이키",
      findYear: 2023,
      emblem: "스우시",
      top: ["무늬1", "무늬2"],
      mid: [],
      bottom: [],
      outline: ["원3"],
    });
    expect(captured).not.toHaveProperty("image");
  });

  it("camelCases the server's response", async () => {
    mswServer.use(
      http.put("*/shoes/SHOE-2", async () =>
        HttpResponse.json({
          model_number: "SHOE-2",
          find_location: "부산",
          manufacturer: "아디다스",
          find_year: 2024,
          emblem: "삼선",
          top: [],
          mid: [],
          bottom: [],
          outline: [],
        })
      )
    );

    const result = await updateShoe({
      modelNumber: "SHOE-2",
      body: {
        modelNumber: "SHOE-2",
        image: null,
        top: [],
        mid: [],
        bottom: [],
        outline: [],
      },
    });

    expect(result).toEqual({
      modelNumber: "SHOE-2",
      findLocation: "부산",
      manufacturer: "아디다스",
      findYear: 2024,
      emblem: "삼선",
      top: [],
      mid: [],
      bottom: [],
      outline: [],
    });
  });
});

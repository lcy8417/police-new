import { describe, it, expect, beforeEach, afterEach, afterAll, beforeAll } from "vitest";
import { http, HttpResponse } from "msw";

import { PATTERNS_ROOT } from "@/entities/pattern";

import { mswServer } from "@/test/msw-server";
import { useCrimeStore } from "./crime-store";
import type { Crime } from "./types";

const blank = (crimeNumber: string): Crime => ({
  crimeNumber,
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
      useCrimeStore.getState().crimeData.map((c) => c.crimeNumber)
    ).toEqual(["1", "2"]);
  });

  it("is a single source of truth: a context-style write is visible to store readers", () => {
    // Simulate a .jsx consumer writing through the bridged setter...
    useCrimeStore.getState().setCrimeData([blank("42")]);
    // ...and a .tsx reader seeing it via the store directly.
    expect(useCrimeStore.getState().crimeData[0].crimeNumber).toBe("42");
  });

  it("refetch hydrates pattern zones to full paths and coerces image", async () => {
    mswServer.use(
      http.get("*/crime", () =>
        HttpResponse.json([
          {
            crime_number: "7",
            image: "scene.png",
            top: [["무늬1", 0]],
            mid: [],
            bottom: [],
            outline: [["원3", true]],
          },
        ])
      )
    );

    await useCrimeStore.getState().refetch();
    const [row] = useCrimeStore.getState().crimeData;

    expect(row.crimeNumber).toBe("7"); // camelCased
    expect(row.top).toEqual([[`${PATTERNS_ROOT}무늬1.png`, 0]]); // hydrated + 0 kept
    expect(row.outline).toEqual([[`${PATTERNS_ROOT}원3.png`, true]]);
    expect(row.image).toBe("scene.png");
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { PATTERNS_ROOT } from "@/entities/pattern";
import {
  fetchShoeDetail,
  fetchShoeStages,
  fetchShoesCount,
  fetchShoesList,
  registerShoe,
  shoeFilterQuery,
  updateShoe,
} from "./shoe-api";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

/** 서버 신발 응답 1건(SCAS 열 이름, snake_case). 메타데이터는 null일 수 있다. */
const SHOE_DTO = {
  ftwr_id: "00758",
  ftwr_group_id: "G038",
  ftwr_group_nm: "crocs(크록스)-038",
  modl_nm: "클래식 클로그",
  brand_code: "B0001",
  makr_code: "M001",
  colct_place: "서울",
  colct_year: "2023",
  sexdstn_se: null,
  swing_se: null,
  ftwr_size: null,
  image: "http://api.test/shoes_images/B/00758.png",
  top: ["무늬1"],
  mid: [],
  bottom: [],
  outline: [],
};

const SHOE = {
  ftwrId: "00758",
  ftwrGroupId: "G038",
  ftwrGroupNm: "crocs(크록스)-038",
  modlNm: "클래식 클로그",
  brandCode: "B0001",
  makrCode: "M001",
  colctPlace: "서울",
  colctYear: "2023",
  sexdstnSe: null,
  swingSe: null,
  ftwrSize: null,
  image: "http://api.test/shoes_images/B/00758.png",
  top: ["무늬1"], // bare names — fetchShoesData never hydrates paths
  mid: [],
  bottom: [],
  outline: [],
};

describe("fetchShoesList (GET /shoes/?page=N)", () => {
  it("list paths have trailing slash", async () => {
    let path = "";
    mswServer.use(
      http.get("*/shoes/", ({ request }) => {
        const url = new URL(request.url);
        path = url.pathname + url.search;
        return HttpResponse.json([]);
      })
    );

    await fetchShoesList(0);

    // 끝 `/`를 빼면 서버가 리다이렉트하며 중계 환경에서 scheme이 틀어진다(설계서 §3-1).
    expect(path).toBe("/shoes/?page=0");
  });

  it("fetchShoesList maps ftwr fields — ftwrId(앞자리 0 보존)·colctPlace·ftwrGroupNm", async () => {
    mswServer.use(
      http.get("*/shoes", ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");
        expect(page).toBe("2");
        return HttpResponse.json([SHOE_DTO]);
      })
    );

    const result = await fetchShoesList(2);

    expect(result).toEqual([SHOE]);
    expect(result[0].ftwrId).toBe("00758");
    expect(result[0].colctPlace).toBe("서울");
    expect(result[0].ftwrGroupNm).toBe("crocs(크록스)-038");
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

  it("treats a 404 page (empty/out-of-range) as an empty list", async () => {
    // 백엔드는 빈 페이지를 404 JSON으로 응답한다 — 이를 빈 목록으로 흡수해야 한다.
    mswServer.use(
      http.get("*/shoes", () =>
        HttpResponse.json(
          { message: "등록된 신발 정보가 없습니다." },
          { status: 404 }
        )
      )
    );

    const result = await fetchShoesList(99);

    expect(result).toEqual([]);
  });
});

describe("fetchShoesCount (GET /shoes/count)", () => {
  it("returns the count field from the response", async () => {
    mswServer.use(
      http.get("*/shoes/count", () => HttpResponse.json({ count: 123 }))
    );

    expect(await fetchShoesCount()).toBe(123);
  });
});

describe("B 단계 거르기 · 집계(J1 · J2 · J8)", () => {
  it("거르기 → 쿼리(빈 값 · all 제외, 신발 ID 문자열 그대로)", () => {
    expect(shoeFilterQuery()).toBe("");
    expect(shoeFilterQuery({ approval: "all", patternInput: "all", ftwrId: "  " })).toBe("");
    expect(
      shoeFilterQuery({ ftwrId: "00758", approval: "no", registFrom: "2026-03-01", registOrg: "12", stage: "approve" })
    ).toBe("&ftwr_id=00758&regist_org=12&regist_from=2026-03-01&approval=no&stage=approve");
  });

  it("목록 · 개수가 같은 거르기를 서버로", async () => {
    const seen: string[] = [];
    mswServer.use(
      http.get("*/shoes/", ({ request }) => {
        seen.push(new URL(request.url).search);
        return HttpResponse.json([]);
      }),
      http.get("*/shoes/count", ({ request }) => {
        seen.push(new URL(request.url).search);
        return HttpResponse.json({ count: 0 });
      })
    );
    expect(await fetchShoesList(1, { patternInput: "out" })).toEqual([]);
    expect(await fetchShoesCount({ patternInput: "out" })).toBe(0);
    expect(seen).toEqual(["?page=1&pattern_input=out", "?pattern_input=out"]);
  });

  it("J1 새 칸 camel 변환(승인 · 작업 상태 · 검색 후보 여부)", async () => {
    mswServer.use(
      http.get("*/shoes/", () =>
        HttpResponse.json([
          { ...SHOE_DTO, approved: true, confm_de: "20261117", work_status: ["측면 없음"], in_search_index: false, regist_org_nm: null },
        ])
      )
    );
    const [row] = await fetchShoesList(0);
    expect(row).toMatchObject({ approved: true, confmDe: "20261117", workStatus: ["측면 없음"], inSearchIndex: false, registOrgNm: null });
  });

  it("GET /shoes/stages → camel", async () => {
    mswServer.use(
      http.get("*/shoes/stages", () =>
        HttpResponse.json({
          stages: [{ key: "pattern", count: 1 }],
          backlog: { month: "2026-11", total: 1, parts: [{ key: "pattern", count: 1 }] },
          today_approved: 3,
        })
      )
    );
    expect(await fetchShoeStages()).toEqual({
      stages: [{ key: "pattern", count: 1 }],
      backlog: { month: "2026-11", total: 1, parts: [{ key: "pattern", count: 1 }] },
      todayApproved: 3,
    });
  });

  it("updateShoe replaceImage → 접두어 뗀 image 를 함께(J5 선택), 없으면 image 키 없음", async () => {
    const bodies: Record<string, unknown>[] = [];
    mswServer.use(
      http.put("*/shoes/00758", async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ message: "ok" });
      })
    );
    const body = { ftwrId: "00758", top: [], mid: [], bottom: [], outline: [] };
    await updateShoe({ ftwrId: "00758", body });
    await updateShoe({ ftwrId: "00758", body, replaceImage: "data:image/png;base64,QUJD" });
    expect("image" in bodies[0]).toBe(false);
    expect(bodies[1].image).toBe("QUJD");
  });
});

describe("fetchShoeDetail (GET /shoes/:ftwrId)", () => {
  it("camelCases the SCAS DTO without hydrating pattern paths, keeping the leading zero", async () => {
    mswServer.use(
      http.get("*/shoes/00758", () => HttpResponse.json({ ...SHOE_DTO, mid: ["선2"] }))
    );

    const result = await fetchShoeDetail("00758");

    expect(result).toEqual({ ...SHOE, mid: ["선2"] });
  });
});

describe("updateShoe (PUT /shoes/:ftwrId)", () => {
  it("설계서 §4-4 키만 보낸다 — image·ftwrId·그룹·성별 등은 빼고, 문양은 이름 문자열로, null 메타데이터는 그대로", async () => {
    let captured: Record<string, unknown> | undefined;
    mswServer.use(
      http.put("*/shoes/00758", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: "신발 정보가 성공적으로 업데이트되었습니다." });
      })
    );

    await updateShoe({
      ftwrId: "00758",
      body: {
        ...SHOE,
        colctYear: null,
        // hydrated full asset paths — as they'd appear in the workbench live state
        image: "data:image/png;base64,DROPPEDME",
        top: [`${PATTERNS_ROOT}무늬1.png`, `${PATTERNS_ROOT}무늬2.png`],
        mid: [],
        bottom: [],
        outline: [`${PATTERNS_ROOT}원3.png`],
      },
    });

    expect(captured).toEqual({
      colctPlace: "서울",
      colctYear: null,
      makrCode: "M001",
      brandCode: "B0001",
      modlNm: "클래식 클로그",
      top: ["무늬1", "무늬2"],
      mid: [],
      bottom: [],
      outline: ["원3"],
    });
    expect(captured).not.toHaveProperty("image");
    expect(captured).not.toHaveProperty("ftwrId");
  });

  it("빈 칸 메타데이터(\"\")도 그대로 보낸다", async () => {
    let captured: Record<string, unknown> | undefined;
    mswServer.use(
      http.put("*/shoes/00759", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: "ok" });
      })
    );

    await updateShoe({
      ftwrId: "00759",
      body: {
        ftwrId: "00759",
        colctPlace: "",
        image: null,
        top: [],
        mid: [],
        bottom: [],
        outline: [],
      },
    });

    expect(captured).toMatchObject({ colctPlace: "", colctYear: null, makrCode: null });
  });
});

describe("registerShoe (POST /shoes/register)", () => {
  it("설계서 §4-4 키로 보낸다 — image는 접두어만 떼고 유지, 문양은 이름 문자열", async () => {
    let captured: Record<string, unknown> | undefined;
    mswServer.use(
      http.post("*/shoes/register", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: "ok" }, { status: 201 });
      })
    );

    await registerShoe({
      ftwrId: "00999",
      colctPlace: "인천",
      colctYear: "2025",
      makrCode: "M002",
      brandCode: "B0002",
      modlNm: "러너",
      // hydrated full asset paths — as they appear in the live register form state
      image: "data:image/png;base64,KEEPME",
      top: [`${PATTERNS_ROOT}무늬1.png`, `${PATTERNS_ROOT}무늬2.png`],
      mid: [],
      bottom: [`${PATTERNS_ROOT}삼각5.png`],
      outline: [`${PATTERNS_ROOT}원3.png`],
    });

    expect(captured).toEqual({
      image: "KEEPME",
      ftwrId: "00999",
      colctPlace: "인천",
      colctYear: "2025",
      makrCode: "M002",
      brandCode: "B0002",
      modlNm: "러너",
      top: ["무늬1", "무늬2"],
      mid: [],
      bottom: ["삼각5"],
      outline: ["원3"],
    });
  });

  it("sends an empty-string image when the form image is null", async () => {
    let captured: Record<string, unknown> | undefined;
    mswServer.use(
      http.post("*/shoes/register", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return new HttpResponse(null, { status: 200 });
      })
    );

    await registerShoe({
      ftwrId: "00010",
      image: null,
      top: [],
      mid: [],
      bottom: [],
      outline: [],
    });

    expect(captured?.image).toBe("");
    expect(captured?.ftwrId).toBe("00010");
  });
});

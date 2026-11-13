import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";
import { PATTERNS_ROOT } from "@/entities/pattern";
import {
  fetchCrimeDetail,
  fetchCrimeHistory,
  fetchCrimeList,
  putCrimePatterns,
  registerCrime,
  saveCrimeEditImage,
  saveCrimeHistory,
  uploadOriginal,
} from "./crime-api";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe("registerCrime (POST /crime/register)", () => {
  it("registerCrime sends SCAS keys — 본문 키 집합이 CrimeRegisterBody와 같고 image 접두어는 제거된다", async () => {
    let captured: Record<string, unknown> | undefined;
    mswServer.use(
      http.post("*/crime/register", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );

    await registerCrime({
      image: "data:image/png;base64,AAAA",
      aprthngNo: "05019-24-0017_5",
      apprslReqestNo: "05019-24-0017",
      pickDt: "2024-01-29 05:31",
      pickPlace: "서울 종로구",
      pickMthCode: "FT001",
      crimeNm: "절도",
      rqestGrfcNm: "서울청",
    });

    expect(captured).toEqual({
      image: "AAAA",
      aprthngNo: "05019-24-0017_5",
      apprslReqestNo: "05019-24-0017",
      pickDt: "2024-01-29 05:31",
      pickPlace: "서울 종로구",
      pickMthCode: "FT001",
      crimeNm: "절도",
      rqestGrfcNm: "서울청",
    });
    expect(Object.keys(captured ?? {}).sort()).toEqual(
      [
        "image",
        "aprthngNo",
        "apprslReqestNo",
        "pickDt",
        "pickPlace",
        "pickMthCode",
        "crimeNm",
        "rqestGrfcNm",
      ].sort()
    );
  });

  it("originalFileId를 주면 본문에 숫자 그대로 넣는다(원본 연결, 설계서 §5-E)", async () => {
    let captured: Record<string, unknown> | undefined;
    mswServer.use(
      http.post("*/crime/register", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );

    await registerCrime({
      image: "data:image/png;base64,AAAA",
      aprthngNo: "05019-24-0017_5",
      apprslReqestNo: "05019-24-0017",
      pickDt: "",
      pickPlace: "",
      pickMthCode: "",
      crimeNm: "",
      rqestGrfcNm: "",
      originalFileId: 42,
    });

    expect(captured?.originalFileId).toBe(42);
  });
});

describe("uploadOriginal (POST /files/original)", () => {
  it("multipart `file`로 고른 File을 손대지 않고 그대로 보내고 {fileId, sha256}을 돌려준다", async () => {
    let contentType = "";
    let hasFileField = false;
    mswServer.use(
      http.post("*/files/original", async ({ request }) => {
        contentType = request.headers.get("content-type") ?? "";
        hasFileField = (await request.formData()).has("file");
        return HttpResponse.json({ fileId: 42, sha256: "ab".repeat(32) });
      })
    );
    // 보낸 본문은 fetch 직전에 본다 — 테스트 환경(jsdom → Node)의 FormData 변환이 파일 이름을
    // 지우므로(서버 쪽에서는 "blob"으로 보임), 같은 File 객체가 그대로 실렸는지를 여기서 확인한다.
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const file = new File(["raw-bytes"], "현장 사진.png", { type: "image/png" });
    const result = await uploadOriginal(file);

    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    fetchSpy.mockRestore();
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBe(file);
    // Content-Type은 직접 붙이지 않는다(브라우저가 경계 값을 넣음).
    expect(new Headers(init.headers).has("content-type")).toBe(false);
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(hasFileField).toBe(true);
    expect(result).toEqual({ fileId: 42, sha256: "ab".repeat(32) });
  });

  it("413·400은 서버 detail 문구를 그대로 담은 ApiError", async () => {
    mswServer.use(
      http.post("*/files/original", () =>
        HttpResponse.json({ detail: "파일이 너무 큽니다(최대 50MB)" }, { status: 413 })
      )
    );
    await expect(uploadOriginal(new File(["x"], "big.png"))).rejects.toMatchObject({
      status: 413,
      detail: "파일이 너무 큽니다(최대 50MB)",
    });

    mswServer.use(
      http.post("*/files/original", () =>
        HttpResponse.json({ detail: "이미지 파일이 아닙니다" }, { status: 400 })
      )
    );
    await expect(uploadOriginal(new File(["x"], "a.txt"))).rejects.toMatchObject({
      status: 400,
      detail: "이미지 파일이 아닙니다",
    });
  });
});

describe("putCrimePatterns (PUT /crime/:aprthngNo)", () => {
  it("strips every zone to bare names, passing the 0 sentinel through unchanged", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/05019-24-0017_5", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await putCrimePatterns("05019-24-0017_5", {
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

  it("extractedRaw가 있으면 extracted_raw로 함께 전달한다 (REQ-SCENE-009(a))", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/2024-002_1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await putCrimePatterns("2024-002_1", {
      top: [],
      mid: [],
      bottom: [],
      outline: [],
      extractedRaw: [{ code: "s21b", score: 0.9 }],
    });

    expect(captured).toEqual({
      top: [],
      mid: [],
      bottom: [],
      outline: [],
      extracted_raw: [{ code: "s21b", score: 0.9 }],
    });
  });

  it("extractedRaw가 없으면 extracted_raw 키를 생략한다(신발/레거시 경로 무변경)", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/2024-003_1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await putCrimePatterns("2024-003_1", { top: [], mid: [], bottom: [], outline: [] });

    expect(captured).toEqual({ top: [], mid: [], bottom: [], outline: [] });
  });
});

describe("saveCrimeHistory (POST /crime/:aprthngNo)", () => {
  it("이력 저장 본문을 SCAS 키(ranking·mtchgId·editImage·extractedRaw)로 만들고 searchNo를 돌려준다", async () => {
    let captured: Record<string, unknown> | undefined;
    mswServer.use(
      http.post("*/crime/05019-24-0017_5", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ search_no: 591656 });
      })
    );

    const result = await saveCrimeHistory({
      aprthngNo: "05019-24-0017_5",
      currentCrimeData: {
        editImage: "data:image/png;base64,EDITEDBASE64==",
        top: [[`${PATTERNS_ROOT}무늬1.png`, 0]],
        mid: [],
        bottom: [],
        outline: [],
      },
      ranking: "3",
      mtchgId: "00758",
    });

    expect(captured).toEqual({
      top: [["무늬1", 0]],
      mid: [],
      bottom: [],
      outline: [],
      ranking: 3,
      mtchgId: "00758",
      editImage: "EDITEDBASE64==",
      extractedRaw: null,
    });
    // 서버 시각을 쓰므로 등록 시각·사건 번호·원본 이미지는 더 이상 보내지 않는다 —
    // 위 toEqual이 JSON 본문의 키 집합을 정확히 비교하므로 옛 키가 섞이면 실패한다.
    expect(captured).not.toHaveProperty("registerTime");
    expect(Object.keys(captured as Record<string, unknown>).sort()).toEqual(
      ["top", "mid", "bottom", "outline", "ranking", "mtchgId", "editImage", "extractedRaw"].sort()
    );
    expect(result).toEqual({ searchNo: 591656 });
  });

  it("defaults ranking to 0, mtchgId/editImage to null when absent", async () => {
    let captured: unknown;
    mswServer.use(
      http.post("*/crime/2024-002_1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ search_no: 1 });
      })
    );

    await saveCrimeHistory({
      aprthngNo: "2024-002_1",
      currentCrimeData: {
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
      ranking: 0,
      mtchgId: null,
      editImage: null,
      extractedRaw: null,
    });
  });

  it("extractedRaw가 있으면 히스토리 스냅샷에 포함한다 (REQ-SCENE-009(c))", async () => {
    let captured: unknown;
    mswServer.use(
      http.post("*/crime/2024-003_1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ search_no: 2 });
      })
    );

    await saveCrimeHistory({
      aprthngNo: "2024-003_1",
      currentCrimeData: {
        editImage: null,
        top: [],
        mid: [],
        bottom: [],
        outline: [],
        extractedRaw: [{ code: "s21b", score: 0.9 }],
      },
    });

    expect(captured).toMatchObject({
      extractedRaw: [{ code: "s21b", score: 0.9 }],
    });
  });
});

describe("saveCrimeEditImage (PUT /crime/edit_image/:aprthngNo)", () => {
  it("splits a data URL down to its base64 payload", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/edit_image/2024-001_1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await saveCrimeEditImage({
      aprthngNo: "2024-001_1",
      scrollState: { image: "data:image/png;base64,EDITBASE64==" },
    });

    expect(captured).toEqual({ image: "EDITBASE64==" });
  });

  it("nulls out only a missing image", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/edit_image/2024-003_1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await saveCrimeEditImage({
      aprthngNo: "2024-003_1",
      scrollState: { image: null },
    });

    expect(captured).toEqual({ image: null });
  });

  it("passes a prefix-less raw base64 image through unchanged (백엔드는 string 요구 — null 금지)", async () => {
    let captured: unknown;
    mswServer.use(
      http.put("*/crime/edit_image/2024-004_1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({});
      })
    );

    await saveCrimeEditImage({
      aprthngNo: "2024-004_1",
      scrollState: { image: "RAWBASE64==" },
    });

    expect(captured).toEqual({ image: "RAWBASE64==" });
  });
});

describe("fetchCrimeList (GET /crime/)", () => {
  it("list paths have trailing slash", async () => {
    let path = "";
    mswServer.use(
      http.get("*/crime/", ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json([]);
      })
    );

    await fetchCrimeList();

    // 끝 `/`를 빼면 서버가 리다이렉트하며 중계 환경에서 scheme이 틀어진다(설계서 §3-1).
    expect(path).toBe("/crime/");
  });

  it("서버가 준 루트 기준 이미지 경로는 backendMediaUrl을 거친다(중계면 그대로)", async () => {
    mswServer.use(
      http.get("*/crime/", () =>
        HttpResponse.json([
          {
            aprthng_no: "A-1",
            image: "/crime_images/A-1.png",
            pidinet_outline: "/crime_outlines/A-1.png",
            top: [],
            mid: [],
            bottom: [],
            outline: [],
          },
        ])
      )
    );

    const [row] = await fetchCrimeList();

    expect(row.image).toBe("/crime_images/A-1.png");
    expect(row.pidinetOutline).toBe("/crime_outlines/A-1.png");
  });

  it("SCAS 감정물 키를 camelCase로 바꾸고 문양 경로는 붙이지 않는다", async () => {
    mswServer.use(
      http.get("*/crime/", () =>
        HttpResponse.json([
          {
            aprthng_no: "05019-24-0017_5",
            apprsl_reqest_no: "05019-24-0017",
            pick_dt: "2024-01-29T05:31:00",
            pick_place: "서울 종로구",
            pick_mth_code: "FT001",
            crime_nm: "절도",
            rqest_grfc_nm: "서울청",
            process_sttus: 0,
            image: "http://api.test/crime_images/05019-24-0017_5.png",
            edit_image: null,
            top: [["무늬1", 0]],
            mid: [],
            bottom: [],
            outline: [],
            extracted_raw: null,
            pidinet_outline: null,
            frst_regist_dt: "2024-06-15T19:00:00",
          },
        ])
      )
    );

    const result = await fetchCrimeList();

    expect(result).toEqual([
      {
        aprthngNo: "05019-24-0017_5",
        apprslReqestNo: "05019-24-0017",
        pickDt: "2024-01-29T05:31:00",
        pickPlace: "서울 종로구",
        pickMthCode: "FT001",
        crimeNm: "절도",
        rqestGrfcNm: "서울청",
        processSttus: 0,
        image: "http://api.test/crime_images/05019-24-0017_5.png",
        editImage: null,
        top: [["무늬1", 0]], // bare names — fetchCrimeData never hydrates paths
        mid: [],
        bottom: [],
        outline: [],
        extractedRaw: null,
        pidinetOutline: null,
        frstRegistDt: "2024-06-15T19:00:00",
      },
    ]);
  });
});

describe("fetchCrimeDetail (GET /crime/:aprthngNo)", () => {
  it("fetchCrimeDetail returns history rows — searchNo·mtchgId로 변환된 이력 목록", async () => {
    let capturedUrl = "";
    mswServer.use(
      http.get("*/crime/05019-24-0017_5", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([
          { search_no: 591656, frst_regist_dt: "2024-06-15 19:00:00", ranking: 3, mtchg_id: "00758" },
          { search_no: 591657, frst_regist_dt: "2024-06-16 09:00:00", ranking: 0, mtchg_id: null },
        ]);
      })
    );

    const result = await fetchCrimeDetail("05019-24-0017_5");

    expect(capturedUrl).toContain(`/crime/${encodeURIComponent("05019-24-0017_5")}`);
    expect(result).toEqual([
      { searchNo: 591656, frstRegistDt: "2024-06-15 19:00:00", ranking: 3, mtchgId: "00758" },
      { searchNo: 591657, frstRegistDt: "2024-06-16 09:00:00", ranking: 0, mtchgId: null },
    ]);
  });
});

describe("fetchCrimeHistory (GET /crime/history/:searchNo)", () => {
  it("hydrates pattern paths to full asset URLs, then camelCases the rest", async () => {
    mswServer.use(
      http.get("*/crime/history/591656", () =>
        HttpResponse.json({
          edit_image: "data:image/png;base64,BBBB",
          mtchg_id: "00758",
          top: [["무늬1", 0]],
          mid: [["선2", 1]],
          bottom: [],
          outline: [],
          extracted_raw: null,
          pidinet_outline: null,
        })
      )
    );

    const result = await fetchCrimeHistory(591656);

    expect(result).toEqual({
      editImage: "data:image/png;base64,BBBB",
      mtchgId: "00758",
      top: [[`${PATTERNS_ROOT}무늬1.png`, 0]],
      mid: [[`${PATTERNS_ROOT}선2.png`, 1]],
      bottom: [],
      outline: [],
      extractedRaw: null,
      pidinetOutline: null,
    });
  });
});

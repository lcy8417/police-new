import { describe, it, expect } from "vitest";
import { convertKeysToCamelCase } from "./case";

describe("convertKeysToCamelCase", () => {
  it("converts snake_case keys to camelCase", () => {
    expect(
      convertKeysToCamelCase({ aprthng_no: "1", frst_regist_dt: "t" })
    ).toEqual({ aprthngNo: "1", frstRegistDt: "t" });
  });

  it("SCAS 열 이름(감정물·이력·신발)을 설계서 §4 camel 이름으로 바꾼다", () => {
    expect(
      convertKeysToCamelCase({
        apprsl_reqest_no: "a",
        pick_mth_code: "b",
        rqest_grfc_nm: "c",
        process_sttus: 0,
        pidinet_outline: null,
        search_no: 1,
        mtchg_id: "00758",
        ftwr_group_nm: "g",
        sexdstn_se: null,
        colct_year: "2023",
      })
    ).toEqual({
      apprslReqestNo: "a",
      pickMthCode: "b",
      rqestGrfcNm: "c",
      processSttus: 0,
      pidinetOutline: null,
      searchNo: 1,
      mtchgId: "00758",
      ftwrGroupNm: "g",
      sexdstnSe: null,
      colctYear: "2023",
    });
  });

  it("recurses into arrays and nested objects", () => {
    expect(convertKeysToCamelCase({ a_b: [{ c_d: 1 }] })).toEqual({
      aB: [{ cD: 1 }],
    });
  });

  it("leaves primitives and already-camel keys untouched", () => {
    expect(convertKeysToCamelCase({ foo: 1, barBaz: 2 })).toEqual({
      foo: 1,
      barBaz: 2,
    });
    expect(convertKeysToCamelCase(42)).toBe(42);
    expect(convertKeysToCamelCase(null)).toBeNull();
  });
});

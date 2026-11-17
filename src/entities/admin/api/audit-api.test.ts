import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw-server";

import { describeAuditEvent, auditShortTime } from "../model/audit-text";
import type { AuditEvent } from "../model/types";
import { fetchAuditEvents, fetchEvents, verifyAuditChain } from "./admin-api";

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

const AUDIT_DTO = {
  event_id: 7,
  event_se: "USER_CHANGE",
  actor_id: "root",
  actor_nm: "총괄관리자",
  actor_org_nm: "경찰청",
  target_se: "USER",
  target_id: "kim01",
  target_version: null,
  reason_cn: null,
  detail: { op: "UPDATE", before: { user_nm: "김수사", use_at: "Y" }, after: { user_nm: "김수사", use_at: "N" } },
  occurred_dt: "2026-11-03T10:20:00+09:00",
  row_hash: "a".repeat(64),
};

describe("감사 · 대상 번호 API(K1~K3)", () => {
  it("fetchEvents는 대상 번호를 앞뒤 공백 없이 target_id로", async () => {
    let search: URLSearchParams | null = null;
    mswServer.use(
      http.get("*/admin/events", ({ request }) => {
        search = new URL(request.url).searchParams;
        return HttpResponse.json([]);
      })
    );
    await fetchEvents({ targetId: " 00089-26-0080 ", page: 0 });
    expect(search!.get("target_id")).toBe("00089-26-0080");
  });

  it("fetchAuditEvents는 행위 구분 여러 개를 event_se 여러 번으로, 응답(세부 내용 포함)을 camel로", async () => {
    let search: URLSearchParams | null = null;
    mswServer.use(
      http.get("*/admin/audit-events", ({ request }) => {
        search = new URL(request.url).searchParams;
        return HttpResponse.json([AUDIT_DTO]);
      })
    );
    const rows = await fetchAuditEvents({ eventSe: ["ROLE_CHANGE", "USER_CHANGE"], actorId: "root", page: 1 });
    expect(search!.getAll("event_se")).toEqual(["ROLE_CHANGE", "USER_CHANGE"]);
    expect(search!.get("actor_id")).toBe("root");
    expect(search!.get("page")).toBe("1");
    expect(rows[0].eventId).toBe(7);
    expect(rows[0].rowHash).toHaveLength(64);
    expect(rows[0].detail).toEqual({ op: "UPDATE", before: { userNm: "김수사", useAt: "Y" }, after: { userNm: "김수사", useAt: "N" } });
  });

  it("verifyAuditChain은 범위를 from_id · to_id로, 결과를 camel로", async () => {
    let search: URLSearchParams | null = null;
    mswServer.use(
      http.get("*/admin/audit-events/verify", ({ request }) => {
        search = new URL(request.url).searchParams;
        return HttpResponse.json({ checked: 4, broken_at: 3, last_hash: "f".repeat(64) });
      })
    );
    expect(await verifyAuditChain({ fromId: 2, toId: 9 })).toEqual({ checked: 4, brokenAt: 3, lastHash: "f".repeat(64) });
    expect(Object.fromEntries(search!)).toEqual({ from_id: "2", to_id: "9" });
  });
});

const event = (extra: Partial<AuditEvent>): AuditEvent => ({
  eventId: 1,
  eventSe: "USER_CHANGE",
  actorId: "root",
  actorNm: null,
  actorOrgNm: null,
  targetSe: "USER",
  targetId: "kim01",
  targetVersion: null,
  reasonCn: null,
  detail: null,
  occurredDt: "2026-11-03T10:20:00+09:00",
  rowHash: "a".repeat(64),
  ...extra,
});

describe("describeAuditEvent — 관리 감사 한 줄을 글로", () => {
  it("권한 · 역할", () => {
    expect(
      describeAuditEvent(event({ eventSe: "PERMISSION_CHANGE", detail: { before: ["SHOE_VIEW", "SHOE_EDIT"], after: ["SHOE_VIEW", "EXAM_VIEW"] } }), {
        featureName: (c) => ({ EXAM_VIEW: "감정 기록 보기", SHOE_EDIT: "신발 등록·수정" })[c] ?? c,
      })
    ).toBe("kim01 기능 권한 켬 감정 기록 보기 / 끔 신발 등록·수정");
    expect(
      describeAuditEvent(event({ eventSe: "ROLE_CHANGE", detail: { before: ["EXAMINER"], after: [] } }), {
        roleName: (c) => (c === "EXAMINER" ? "감정관" : c),
      })
    ).toBe("kim01 역할 감정관 → 없음");
  });

  it("사용자 · 관서", () => {
    expect(describeAuditEvent(event({ detail: { op: "CREATE", before: null, after: {} } }))).toBe("kim01 사용자 추가");
    expect(describeAuditEvent(event({ detail: { op: "UNLOCK" } }))).toBe("kim01 잠금 해제");
    expect(describeAuditEvent(event({ detail: { op: "UPDATE", before: { useAt: "Y", userNm: "a" }, after: { useAt: "N", userNm: "a" } } }))).toBe(
      "kim01 사용 중지"
    );
    expect(
      describeAuditEvent(
        event({ eventSe: "ORG_CHANGE", targetSe: "ORG", targetId: "5", detail: { op: "UPDATE", before: { orgNm: "동대문서", useAt: "Y" }, after: { orgNm: "동대문서", useAt: "N" } } })
      )
    ).toBe("동대문서 사용 여부 Y → N");
  });

  it("모르는 모양은 행위 이름 + 대상만(글을 지어내지 않음)", () => {
    expect(describeAuditEvent(event({ eventSe: "SHOE_APPROVE", targetSe: "SHOE", targetId: "00758" }))).toBe("신발 승인 — SHOE 00758");
    expect(describeAuditEvent(event({ eventSe: "PERMISSION_CHANGE", detail: { x: 1 } }))).toBe("kim01 기능 권한 변경");
  });

  it("짧은 시각 「MM-DD HH:mm」", () => {
    expect(auditShortTime("2026-11-03T10:20:00+09:00")).toBe("11-03 10:20");
  });
});

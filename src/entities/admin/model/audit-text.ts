/**
 * 감사 기록(K2) 한 줄을 사람이 읽는 글로 — S13 「관리자 변경 이력」 · S14 「관리자 행위」가 같이 쓴다.
 * 세부 내용(`detail`)은 서버 관리자 API(`routes/admin.py`)가 남기는 모양 그대로(키는 camel 로 바뀐 뒤):
 * 권한 · 역할 = `{ before: [...], after: [...] }`, 사용자 · 관서 = `{ op, before, after }`(op: CREATE · UPDATE ·
 * PASSWORD_RESET · UNLOCK). 모르는 모양이면 행위 이름 + 대상만 쓴다(글을 지어내지 않는다).
 */
import type { AuditEvent, AuditEventSe } from "./types";

/** 관리자 행위(관리 4종) — S14 「관리자 행위」 탭 · S13 「관리자 변경 이력」의 거르기 값. */
export const ADMIN_EVENT_SE: AuditEventSe[] = ["ROLE_CHANGE", "PERMISSION_CHANGE", "ORG_CHANGE", "USER_CHANGE"];

/** 감사 행위 이름(화면 글자). */
export const AUDIT_EVENT_LABELS: Record<AuditEventSe, string> = {
  EXAM_CONFIRM: "판정 확정",
  EXAM_SUPERSEDE: "다시 판정",
  EXAM_REOPEN: "판정 다시 열기",
  CROSS_REVIEW_REQUEST: "교차 검증 요청",
  CROSS_REVIEW_DECIDE: "교차 검증 의견 · 회수",
  REPORT_SEND: "감정서 발송",
  REPORT_CORRECT: "감정서 정정",
  SHOE_APPROVE: "신발 승인",
  FILE_DOWNLOAD: "파일 내려받기",
  ROLE_CHANGE: "역할 변경",
  PERMISSION_CHANGE: "기능 권한 변경",
  ORG_CHANGE: "관서 변경",
  USER_CHANGE: "사용자 변경",
};

/** 코드 → 이름(역할 · 기능). 모르는 코드는 코드 그대로. */
export interface AuditTextLabels {
  roleName?: (code: string) => string;
  featureName?: (code: string) => string;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asStrings = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((v) => typeof v === "string") ? (value as string[]) : null;

const text = (value: unknown): string => (value === null || value === undefined || value === "" ? "없음" : String(value));

function listChange(before: string[], after: string[], name: (code: string) => string): string {
  const added = after.filter((c) => !before.includes(c)).map(name);
  const removed = before.filter((c) => !after.includes(c)).map(name);
  const parts = [...(added.length ? [`켬 ${added.join(" · ")}`] : []), ...(removed.length ? [`끔 ${removed.join(" · ")}`] : [])];
  return parts.length ? parts.join(" / ") : "바뀐 것 없음";
}

const USER_SE_NAME: Record<string, string> = { ADMIN: "관리자", USER: "사용자" };

function userUpdateText(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string {
  if (!before || !after) return "정보 수정";
  const parts: string[] = [];
  if (before.userNm !== after.userNm) parts.push(`이름 ${text(before.userNm)} → ${text(after.userNm)}`);
  if (before.userSe !== after.userSe) {
    parts.push(`구분 ${USER_SE_NAME[String(before.userSe)] ?? text(before.userSe)} → ${USER_SE_NAME[String(after.userSe)] ?? text(after.userSe)}`);
  }
  if (before.useAt !== after.useAt) parts.push(after.useAt === "N" ? "사용 중지" : "다시 사용");
  if (before.orgId !== after.orgId) parts.push("소속 관서 변경");
  return parts.length ? parts.join(" · ") : "정보 저장(바뀐 것 없음)";
}

/** 감사 기록 한 줄 → 「대상 + 무엇을」 글. */
export function describeAuditEvent(event: AuditEvent, labels: AuditTextLabels = {}): string {
  const roleName = labels.roleName ?? ((c: string) => c);
  const featureName = labels.featureName ?? ((c: string) => c);
  const detail = asRecord(event.detail);
  const before = detail?.before;
  const after = detail?.after;
  const op = typeof detail?.op === "string" ? detail.op : null;
  const target = event.targetId;

  switch (event.eventSe) {
    case "PERMISSION_CHANGE": {
      const b = asStrings(before);
      const a = asStrings(after);
      return b && a ? `${target} 기능 권한 ${listChange(b, a, featureName)}` : `${target} 기능 권한 변경`;
    }
    case "ROLE_CHANGE": {
      const b = asStrings(before);
      const a = asStrings(after);
      if (!b || !a) return `${target} 역할 변경`;
      const names = (codes: string[]) => (codes.length ? codes.map(roleName).join(" · ") : "없음");
      return `${target} 역할 ${names(b)} → ${names(a)}`;
    }
    case "USER_CHANGE":
      if (op === "CREATE") return `${target} 사용자 추가`;
      if (op === "PASSWORD_RESET") return `${target} 비밀번호 초기화`;
      if (op === "UNLOCK") return `${target} 잠금 해제`;
      if (op === "UPDATE") return `${target} ${userUpdateText(asRecord(before), asRecord(after))}`;
      return `${target} 사용자 변경`;
    case "ORG_CHANGE": {
      const a = asRecord(after);
      const b = asRecord(before);
      const orgNm = text(a?.orgNm ?? b?.orgNm ?? target);
      if (op === "CREATE") return `관서 추가 ${orgNm}`;
      if (op === "UPDATE" && a && b && a.useAt !== b.useAt) return `${orgNm} 사용 여부 ${text(b.useAt)} → ${text(a.useAt)}`;
      return `${orgNm} 관서 변경`;
    }
    default:
      return `${AUDIT_EVENT_LABELS[event.eventSe] ?? event.eventSe} — ${event.targetSe} ${target}`;
  }
}

/** 서버 시각(KST ISO `YYYY-MM-DDTHH:mm:ss+09:00`) → 「MM-DD HH:mm」(시안 이력 줄 모양). */
export function auditShortTime(iso: string): string {
  return `${iso.slice(5, 10)} ${iso.slice(11, 16)}`;
}

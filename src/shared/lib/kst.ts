// @MX:NOTE: [AUTO] KST_OFFSET_MS(9시간) 하드코딩 - 타임존 라이브러리 미사용, CLAUDE.md에 문서화된 의도적 고정값("타임존 KST 하드코딩" 관례)
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * ISO timestamp shifted to KST with an explicit `+09:00` suffix.
 * Preserves the exact behavior hardcoded in crud.js#fetchHistorySave:
 * `new Date(Date.now() + 9h).toISOString().replace("Z", "+09:00")`.
 */
export function toKstIso(date: Date = new Date()): string {
  return new Date(date.getTime() + KST_OFFSET_MS)
    .toISOString()
    .replace("Z", "+09:00");
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 서버 시각(ISO 8601, 보통 `+09:00`)을 KST 표시 문자열 `YYYY-MM-DD HH:mm`(초 포함 옵션)로.
 * 브라우저 시간대와 무관하게 항상 한국 시간으로 보인다. 해석할 수 없으면 원문을 그대로 돌려준다.
 */
export function formatKstDateTime(iso: string, withSeconds = false): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return iso;
  const shifted = new Date(time + KST_OFFSET_MS).toISOString();
  return `${shifted.slice(0, 10)} ${shifted.slice(11, withSeconds ? 19 : 16)}`;
}

/** KST 날짜 `YYYY-MM-DD`(관리자 사용 기록의 `from`/`to` 필터). `offsetDays`로 며칠 전·후. */
export function kstDateString(date: Date = new Date(), offsetDays = 0): string {
  return new Date(date.getTime() + KST_OFFSET_MS + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

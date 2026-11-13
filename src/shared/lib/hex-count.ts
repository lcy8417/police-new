// hex 색 개수 세기(순수 함수). scripts/ui/count-hex.mjs 가 이 파일을 읽어 쓴다 — 정규식은 여기가 정본.
// 3·4·6·8자리만 색으로 보고 5자리 등은 색이 아니다. `// hex-ok`로 끝나는 줄(앵커 링크 등)은 세지 않는다.
export const HEX_PATTERN = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;

const HEX_OK_SUFFIX = /\/\/\s*hex-ok\s*$/;

export function countHex(source: string): number {
  let total = 0;
  for (const line of source.split("\n")) {
    if (HEX_OK_SUFFIX.test(line)) continue;
    total += line.match(HEX_PATTERN)?.length ?? 0;
  }
  return total;
}

// hex 색 개수 세기(순수 함수). scripts/ui/count-hex.mjs 에 같은 구현이 복제돼 있고(.mjs 는 .ts 를 못 읽음),
// 두 구현이 항상 같도록 hex-count.test.ts 가 정규식(source·flags)과 결과를 대조한다.
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

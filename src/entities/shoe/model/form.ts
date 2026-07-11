import type { Shoe } from "./types";

/**
 * 빈 신발 작업 폼(엔티티 `Shoe` 형태). 등록(신규)과 편집(되돌리기)이 공유하는
 * 초기값이라 페이지가 아니라 엔티티가 소유한다 — 워크벤치 위젯(widgets 계층)은
 * FSD 단방향 규칙상 pages를 import할 수 없기 때문이다.
 *
 * `image`는 업로드 전 `null`이고 저장 시점에 검증한다. 문양은 경로 문자열 배열,
 * 나머지 메타 필드는 컨트롤드 입력을 위해 빈 문자열로 채운다.
 */
export const EMPTY_SHOE_FORM: Shoe = {
  image: null,
  top: [],
  mid: [],
  bottom: [],
  outline: [],
  modelNumber: "",
  findLocation: "",
  manufacturer: "",
  emblem: "",
  findYear: "",
};

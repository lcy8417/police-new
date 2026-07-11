import type { Shoe } from "@/entities/shoe";

/**
 * `/shoesRegister`의 작업용 폼 상태. 레거시 `ShoesRegister.jsx`의 `formData`를
 * 그대로 옮긴 것으로, 타입은 엔티티 `Shoe`를 재사용한다 — 이 형태가
 * `usePatternManager`의 신발 모드(`{ formData, setFormData }`) 시그니처와 그대로
 * 맞물리기 때문이다(문양은 경로 문자열 배열).
 *
 * `image`는 업로드 전 `null`이고, 저장 시점에 `registerShoe`가 non-null을
 * 검증·전송한다. 나머지 메타 필드는 컨트롤드 입력을 위해 초기값을 모두 채운다.
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

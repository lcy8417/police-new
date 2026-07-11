/**
 * `EMPTY_SHOE_FORM`은 엔티티(`@/entities/shoe`)로 이관했다 — 등록·편집이 공유하는
 * 초기값이라 페이지 전용 위치가 부적절하기 때문이다. 기존 import 경로 호환을 위해
 * 여기서 재-export만 유지한다(신규 코드는 `@/entities/shoe`에서 직접 가져올 것).
 */
export { EMPTY_SHOE_FORM } from "@/entities/shoe";

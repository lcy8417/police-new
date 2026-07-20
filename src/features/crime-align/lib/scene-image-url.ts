/**
 * 저장 현장 이미지 정적 URL.
 *
 * SPEC-ALIGN-SETUP-001 REQ-ALIGN-002b(HARD): 정렬 캔버스는 페이지의 원본/편집
 * 토글 상태와 **무관하게 항상** 이 URL(저장 원본 `static/crime_images/<n>.png`)을
 * 사용해야 한다. `crime_data`의 편집 결과 필드(camelCase 계층에서 노출되는 그 필드)를
 * 소스로 사용해서는 안 된다(편집본은 `perspective_image`의 해상도 변경 warp 산출물이라
 * `scale = img.naturalWidth / dispW` 환산의 전제가 깨진다 — spec.md §F 공유 조항).
 * (본 슬라이스는 정적 검사로 해당 필드명 리터럴을 소스에 두지 않는다 — AC-ALIGN-021.)
 *
 * 백엔드 정적 마운트(`(final) police-server/main.py`의 `/crime_images`)를 직접
 * 가리켜, 페이지의 `imageLoad({ crimeNumber, edit })` 토글 경로를 우회한다.
 */
export function sceneImageUrl(crimeNumber: string): string {
  const base = import.meta.env.VITE_API_URL ?? "";
  return `${base}/crime_images/${crimeNumber}.png`;
}

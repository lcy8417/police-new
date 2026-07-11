# API·데이터통신 규약 — 경찰 신발자국 매칭 프론트엔드

**한 줄 요약**: 무거운 처리(패턴 추출·이미지 검색·각도 보정·유사도)는 **별도 FastAPI 백엔드**가 한다. 이 저장소는 `VITE_API_URL`로 그 백엔드와 HTTP로 통신하는 **순수 클라이언트**다. 통신 계층이 **두 규약(camelCase 변환 / 무변환)**으로 갈리니 항상 어느 계층인지 확인한다.

> `.env`의 `VITE_API_URL`이 백엔드를 가리켜야 한다(예 `http://localhost:8000`). 아니면 모든 fetch가 조용히 실패(에러는 `console.error`만).

---

## 0. 지켜야 할 것 (체크리스트)

| # | 규칙 | 강제 |
|---|---|---|
| 1 | 새 읽기쿼리는 `entities/{name}/api`에 `useQuery`로 (TanStack v5) | 필수(신규) |
| 2 | **CRUD·리스트 응답은 camelCase 변환**(`convertKeysToCamelCase`) — `services/crud.js`·`entities/*/api` | 필수 |
| 3 | **이미지 처리 엔드포인트(`services/api.js`)는 camelCase 변환 안 함** — snake/camel 혼재 주의 | 필수(인지) |
| 4 | 이미지는 **base64 data URL**로 오가며, POST 전 `data:image/...;base64,` 접두어 제거 | 필수 |
| 5 | 문양추출 `line_ys`·`render_size`는 **정수** + 이미지 범위 내 clamp (§4) | 필수(백엔드 크래시 방지) |
| 6 | 타임스탬프는 **KST 하드코딩**(`toKstIso` / `+09:00`) | 필수 |
| 7 | 검색 쿼리 키에 **디바운스된 문양 시그니처** + settled 게이트(§5) | 필수(이중요청 방지) |

---

## 1. 스택 — fetch + TanStack Query v5

- 모든 서버 상태(캐시·로딩·에러)는 `useQuery`/`useMutation`이 관리. 컴포넌트에서 raw fetch·`useState` 로딩 플래그 금지.
- 공용 클라이언트: `src/shared/api/client.ts` — `apiGet<T>(path)`, `apiSend(path, method, body)`, `stripDataUrlPrefix`, `stripDataUrl`. 모듈 로드 시점에 `import.meta.env.VITE_API_URL`을 읽는다.

---

## 2. ⚠ 두 API 계층, 두 규약 (최대 혼선 지점)

### (A) CRUD·리스트 — camelCase 변환함
- `src/services/crud.js`(레거시, 아직 활성) + `src/entities/{crime,shoe}/api`(타입드 승격).
- 서버는 snake_case, 응답을 **`convertKeysToCamelCase`**(`shared/lib`)로 camelCase 변환해서 쓴다.
- crud.js exports: `fetchCrimeData`·`fetchShoesData`·`fetchCurrentShoes`·`fetchShoesEdit`·`fetchHistoryData`·`fetchCrimeRegister`·`fetchPatterns`(PUT 문양 저장)·`fetchHistorySave`·`fetchEditImageSave`.
- entities 타입드 래퍼(신규 정본): `fetchCrimeList`/`fetchCrimeDetail`/`fetchCrimeHistory`/`registerCrime`(`entities/crime/api/crime-api.ts`), `fetchShoesList`/`fetchShoeDetail`/`updateShoe`(`entities/shoe/api/shoe-api.ts`). 이들은 `apiGet`+`convertKeysToCamelCase` 조합.

### (B) 이미지 처리 — 변환 안 함
- `src/services/api.js` exports: `imageProcessing`·`patternsExtract`·`imageSearch`·`imageLoad`·`fetchPerspective`·`fetchSimilarity`·`saveEditImage`.
- **camelCase 변환을 하지 않는다.** 같은 필드가 한 곳에선 snake_case, 다른 곳에선 camelCase로 나타날 수 있으니 이 차이를 항상 염두에.

**엔드포인트 카탈로그**(`POST` `/crime/:crimeNumber/...` 위주):
| 함수 | 엔드포인트 | body/쿼리 |
|---|---|---|
| `patternsExtract` | `POST /crime/:crimeNumber/patterns_extract` | `{ image, line_ys, render_size, type }` (§4) |
| `imageSearch` | `POST /crime/:crimeNumber/search?page&similarity` | `{ image, top, mid, bottom, outline }` — **필수 문양만**(이름 배열) |
| `imageLoad` | `GET /crime/:crimeNumber/image_load?edit` | — (검색·표시용 현장/편집 이미지) |
| `fetchPerspective` | `POST /crime/demo/perspective` | 4점 각도보정(polygon·render_size·image) |
| `fetchSimilarity` | 유사도 산정 | crimeNumber·modelNumber |
| `saveEditImage` | 편집 이미지 저장 | id·image(base64)·folder |

- `imageSearch` 응답 `similarity`는 **퍼센트(0~100)**(예 69.99). UI는 0~1을 가정하므로 소비 측에서 `>1이면 /100` 정규화(`RetrievalResultsGrid`).

---

## 3. 이미지 파이프라인 (base64 + canvas)

- 이미지는 **base64 data URL**로 오간다. **모든 POST 전 `data:image/...;base64,` 접두어 제거**(`stripDataUrl`/`stripDataUrlPrefix`, 레거시는 수동 `.split(",")`). 참고: `fetchCrimeRegister`·`fetchHistorySave`·`fetchEditImageSave`·`saveEditImage`.
- 클라이언트 변환은 canvas 기반:
  - `hooks/useCalibration.js` — 4점 **각도 보정**(canvas 좌표 → 상대 좌표 → `naturalWidth/Height` 픽셀 → `/crime/demo/perspective` POST).
  - `components/Canvas.jsx` — 크롭·회전.
  - `utils/get-input-change.js`의 `rotateImage`/`resizeImage` — 오프스크린 canvas 회전 + 최대 1000px 다운스케일(둘 다 base64 반환).

---

## 4. ⚠ 문양추출 좌표 계약 (백엔드 크래시 방지 — 실제 사고)

`patternsExtract` body의 `line_ys`(상/중/하 경계선 y)·`render_size`는 **정수 + 이미지 범위 내**여야 한다. 정본 소유: `features/patterns-extract/model/use-pattern-manager.ts`.

- **정수 필수**: `getBoundingClientRect()`·드래그 좌표는 소수(서브픽셀)라, 전송 전 `Math.round`. 소수를 보내면 백엔드 Pydantic이 `int_from_float`(422)로 거절.
- **범위 clamp 필수**: 두 경계선을 `[1, renderH-1]`로 clamp하고 오름차순 보장. 범위를 벗어나면 서버가 이미지 밖을 슬라이스 → NumPy 빈 배열 → `Image.fromarray`가 `tile cannot extend outside image`(500)로 크래시. (네 영역 top/mid/bottom/all 모두 최소 1행 확보.)
- **좌표계 불변식**: `PatternCanvas`의 `recompute()`(canvas 비트맵 = 표시 이미지 rect), `toCanvasY`, `<canvas absolute inset-0 size-full>`, img 사이징(`h-full w-auto object-contain`)은 **절대 바꾸지 않는다**. 추출은 `canvasRef.getBoundingClientRect()`를 `render_size`로, `lineState.lineYs`를 `line_ys`로 보내므로 두 값의 좌표계가 일치해야 한다. 시각 오버레이(틴트·신발 영역 도구·라벨)는 `pointer-events-none` 순수 장식이며 좌표 판정·전송에 관여 금지.
- 순수 좌표 수학은 `features/patterns-extract/lib/line-geometry.ts`(vitest로 경계값 검증).

---

## 5. 검색 — 필수 문양 실시간 재검색 (이중요청 함정)

통합 커맨드센터의 인라인 검색(`CrimeDetailPage`)은 essential(필수) 문양을 바꿀 때마다 재검색한다. 정본 패턴:

- 검색 body 문양 = `filteredPatterns(currentCrimeData)`(필수 토글만, 이름 배열).
- **쿼리 키에 디바운스된 문양 시그니처**를 실어 재조회 구동: `patternsKey = useDebouncedValue(JSON.stringify(searchPatterns), 300)`(`shared/lib/use-debounced-value`).
- **키와 body는 동일 소스**에서: body는 `JSON.parse(patternsKey)`로. 키(디바운스)와 body(라이브)가 어긋나면 요청이 두 번 나간다.
- **settled 게이트**: `enabled: … && patternsKey === JSON.stringify(searchPatterns)`. 디바운스가 라이브와 일치할 때만 발사 → 스테일 값으로 먼저 나가는 빈 요청(이중요청) 원천 차단.
- 필수 0개여도 빈 body로 전체 검색 가능(가드 없음).

---

## 6. KST 타임존 — 하드코딩

- 타임스탬프는 KST 고정: `shared/lib/kst.ts`의 `toKstIso`, 레거시는 `new Date(Date.now() + 9*60*60*1000).toISOString().replace("Z","+09:00")`(`fetchHistorySave`). 새 타임스탬프도 이 방식.

---

## 7. snake ↔ camel 변환

- CRUD 응답은 `convertKeysToCamelCase`(`shared/lib/case.ts`). **수동 매핑 금지.** 변환 후엔 camelCase로 접근(snake로 접근하면 조용히 `undefined`).
- 이미지 API(`services/api.js`)는 변환 안 하므로, 그 응답은 서버 원형(snake) 그대로 다룬다.

# 문양(패턴) 데이터 모델 — 가장 중요하고 가장 실수하기 쉬움

밑창 문양(족적) 데이터의 정본. 이 프로젝트의 최대 지뢰 — **패턴 배열을 다룰 때는 항상 "지금 어떤 표현인지" 먼저 확인**한다.

정본 타입: `src/entities/pattern/model/pattern.ts`.

---

## 1. 네 개의 밑창 영역 (zone)

모든 범죄/신발은 네 부위를 가진다: **`top` · `mid` · `bottom` · `outline`** (한국어 상/중/하/윤곽).

```ts
export type PatternZone = "top" | "mid" | "bottom" | "outline";
```

각 부위는 문양의 배열이다. **단, 요소의 형태가 문맥에 따라 다르다** — 아래 §2.

---

## 2. ⚠ 요소 형태가 문맥마다 다르다 (crime 튜플 vs shoe 문자열)

```ts
export type EssentialFlag = 0 | boolean;
export type PatternEntry = string | readonly [string, EssentialFlag];
```

- **범죄(crime) 패턴** = `[이미지경로, 필수플래그]` **2요소 튜플**. 요소 `[1]`(필수플래그)은 `essentialCheck`가 쓰는 "필수" 토글. 검색은 이 필수 문양만 사용한다.
- **신발(shoe) 패턴**(`formData`/`Shoe` 안에서) = 단순 **경로 문자열**.

코드 전반이 이 차이로 분기한다:
- `use-pattern-manager`는 `formData`/`setFormData`(신발) vs `currentData`/`index`(범죄)로 **모드를 판별**. `index === -1`은 "대상 없음" no-op 가드.
- 중복·삽입 판정은 **경로가 아니라 패턴 이름(basename)** 기준으로 비교해야 한다 — 추출 저장 경로와 팔레트 glob 경로의 표현이 달라 전체 경로 비교는 늘 불일치(중복 발생). `stripPatternPath`로 이름만 뽑아 비교.
- 경계에서 두 표현을 구분: 레거시 `utils/get-input-change.js`의 `onlyPatternName`은 `item.length == 2` 검사로 판별.

---

## 3. 패턴 이미지 경로 규약

패턴 PNG는 `src/assets/Patterns/` 아래 **한국어 도형 이름 폴더**에 있다(`무늬`·`선`·`윤곽선`·`다각`·`삼각`·`사각`·`원`·`항목`, 그리고 통합 폴더 `전체`).

- **서버는 패턴 "이름"만** 보낸다. 클라이언트가 앞에 루트 경로를 붙인다.
- **루트 정본**: `entities/pattern/model/pattern.ts`의 `PATTERNS_ROOT = "/src/assets/Patterns/전체/"`.
  - **경로 붙이기(hydrate)**: `insertPatternPath(entry)` — 이름 → `/src/assets/Patterns/전체/<이름>.png` (crime 튜플/shoe 문자열 양쪽 처리).
  - **경로 벗기기(서버 전송 전)**: `stripPatternPath(entry)` — 전체 경로 → 이름만.
- **주의 — 데이터 계층은 hydrate 안 함**: `fetchShoesList`/`fetchCrimeList`는 이름만 준다. 소비 측(페이지)에서 `insertPatternPath`로 붙여 표시 컴포넌트에 넘기고, **표시 컴포넌트 내부에서 재변환 금지**(이중 변환 시 경로 깨짐).
- 이 루트는 여러 곳에 하드코딩되어 있다(`use-pattern-manager`의 `format` 클로저, 레거시 `path-utils.js`, `crud.js#fetchHistoryData`). 현재는 하드코딩된 `/src/assets/Patterns/전체/`를 사실상 단일 출처로 취급.
- 팔레트 선택기(picker)는 Vite `import.meta.glob(..., { eager: true })`로 각 폴더를 번들링(`utils/get-patterns-path.js`) — 이 경로는 `/src/assets/Patterns/<폴더>/<이름>.png`라 추출 저장 경로와 **표현이 다름**(§2의 이름 기준 비교 이유).

---

## 4. FSD 대체 컴포넌트

문양 UI는 `features/patterns-extract/ui`가 정본(레거시 3종은 `ShoesRegisterMain`이 아직 사용하므로 존치):
- **문양 정보(수집처/타깃)** = `PatternZones` — 상/중/하/윤곽 4존. 부위 헤더 클릭=삽입 대상 선택, 썸네일 클릭=삭제, 우클릭=필수 토글, 드롭 타깃. 필수 문양은 레드 테두리+"필수" 배지로 강조.
- **문양 리스트(소스/라이브러리)** = `PatternPalette` — 종류 버튼(⚠ **텍스트 전용**: `e.target.textContent`로 종류를 읽으므로 버튼 안에 아이콘/자식 엘리먼트 금지) + 썸네일 그리드. draggable, 클릭 삽입, 이미 삽입된 문양은 비활성.
- **캔버스** = `PatternCanvas` — 이미지 표시 + 상/중/하 경계선 편집 + 신발 사각 영역 도구. 좌표 계약은 `@docs/api-communication.md` §4.
- 두 패널은 색으로 역할 구분(리스트=teal 소스, 정보=blue 타깃) + 드래그 방향 어포던스.

---

## 5. 상태 소유 — usePatternManager

`features/patterns-extract/model/use-pattern-manager.ts`가 문양·경계선 상태를 소유한다. 반환 API(예): `patterns`·`selected`·`lineState`·`extractPattern`·`clearPattern`·`insertPattern`·`insertPatternToZone`·`deletePattern`·`essentialCheck`.

- **crime 모드**: `{ index, currentData, imgRef }`. 문양은 `[경로,필수]` 튜플, `setCrimeData`로 store 갱신.
- **shoe 모드**: `{ formData, setFormData }`. 문양은 문자열.
- `essentialCheck(kind, src)`: 해당 튜플의 필수플래그 토글(crime 전용). 검색 대상이 이 플래그로 정해진다.
- 삽입/중복 방지 로직은 **이름 기준 공통 함수**로 통일(클릭 삽입·존 지정 삽입·DnD 세 경로 공유).

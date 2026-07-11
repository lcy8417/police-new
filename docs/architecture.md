# FSD 아키텍처 배치 규칙 — 경찰 신발자국 매칭 프론트엔드

이 문서는 **"이 코드/컴포넌트/훅/쿼리를 어느 폴더에 둘까"**를 결정하는 정본이다.
`src/`는 FSD(Feature-Sliced Design) 계층으로 이행 중이며, **신규·리팩터는 FSD로, 레거시는 손대는 김에 이동**한다.

> 실측: `ls src/` → `app pages widgets features entities shared` (FSD) + `components hooks services utils App.jsx main.jsx`(레거시 잔존).

---

## 1. 계층과 의존 방향 — 필수

**단방향**: `app → pages → widgets → features → entities → shared`. 상위만 하위를 import한다. **역방향·features↔features cross-import 금지.**

| 계층 | 담당 | import 가능 | 이 프로젝트의 실제 슬라이스 |
|------|------|-------------|------------------------------|
| **app** | 부팅·프로바이더 | 모든 하위 | `src/app/providers/` (QueryClient 등). ⚠ 라우터는 아직 `src/App.jsx`(레거시)에 있음 |
| **pages** | 라우트 엔트리 + 조립 | widgets·features·entities·shared | `pages/crime-search`(CrimeDetailPage 등), `pages/crime-register`, `pages/shoe-repository` |
| **widgets** | 화면 셸·조립 | features·entities·shared | `widgets/app-shell`(AppShell·TopNav·Sidebar·`usePageHeader`) |
| **features** | 사용자 액션·인터랙션 상태·뮤테이션 | entities·shared | `features/patterns-extract`, `features/crime-search`, `features/crime-register`, `features/shoe-repository` |
| **entities** | 도메인 타입 + 읽기쿼리 + 표시 UI | shared | `entities/crime`, `entities/shoe`, `entities/pattern` |
| **shared** | 비즈무관 인프라 | 자기 자신만 | `shared/ui`(shadcn), `shared/lib`, `shared/api`, `shared/hooks` |

**핵심 분업**: 읽기(useQuery) = entities/api, 쓰기·액션·상호작용 상태 = features, 조립 = widgets/pages, 껍데기 = shared.

---

## 2. 전역 상태 — Zustand 단일 store + refetch 기반

- **정본**: `entities/crime/model/crime-store.ts`의 `useCrimeStore`. 전체 `crimeData` 배열을 담는 단일 출처(레거시 Context 브리지는 제거 완료).
- **재조회 패턴**: 서버 데이터를 바꾼 뒤에는 수동 재조회가 아니라 **`useCrimeStore.getState().refetch()`** (또는 셀렉터). `App.jsx`가 마운트 시 1회 `refetch()`로 초기 로드한다.
- **낙관적 갱신 ↔ 서버 저장은 분리**: 컴포넌트는 `setCrimeData`로 로컬을 낙관적으로 바꾸는 **동시에** 서버에도 별도 저장한다. 이 둘은 자동 동기화되지 않는다 — 서버 반영이 필요하면 저장 후 `refetch()`.
- feature 전용 상태(선택 부위·경계선 등)는 그 feature의 훅이 소유: 예 `features/patterns-extract/model/use-pattern-manager.ts`.

---

## 3. 슬라이스 내부 세그먼트 (ui / model / api / lib)

각 슬라이스는 세그먼트 폴더로 나눈다. **파일명**: 컴포넌트 `PascalCase.tsx` / 훅·유틸·model `kebab-case.ts` / 폴더 `kebab-case`.

```
entities/crime/
├── api/     crime-api.ts (읽기쿼리 fetchCrimeList 등) · query-keys.ts
├── model/   crime-store.ts (Zustand) · types.ts (Crime/CrimeDto)
└── index.ts 🚪 단일 공개 배럴

features/patterns-extract/
├── ui/      PatternCanvas · PatternZones · PatternPalette
├── model/   use-pattern-manager.ts (문양·경계선 상태 소유)
├── lib/     line-geometry.ts (순수 좌표 수학 — vitest 검증)
└── index.ts
```

- **읽기쿼리 = `entities/{name}/api`** (`fetchCrimeList`, `fetchShoesList`, `fetchCrimeDetail`, `fetchShoeDetail`…). TanStack `useQuery`로 승격.
- **외부는 배럴 경로로만** import: `@/entities/crime`, `@/features/patterns-extract`. deep-import 지양.
- **테스트 colocate**: `.test.ts`는 소스 옆에(예 `line-geometry.test.ts`, `pattern.test.ts`).

---

## 4. 라우팅 (react-router-dom v7)

- 정본은 아직 `src/App.jsx`의 `BrowserRouter`(FSD `app/`로 이행 대상). `/` → `/crimeRegister` 리다이렉트.
- **통합 커맨드센터**: `/search/:crimeNumber` = `pages/crime-search/ui/CrimeDetailPage`. 기존 "사건상세 + 패턴추출 + 인라인 신발검색"이 **한 화면으로 병합**됨(문양추출은 `?mode=search`로 인라인 검색모드 전환, 뒤로가기로 복귀). `/search/:crimeNumber/patternExtract`·`/shoesResult`는 이 URL로 **리다이렉트 스텁**.
- 그 외: `/search`(목록), `/search/:crimeNumber/shoesResult/detail/:modelNumber`(ResultDetail), `/shoesRepository/:modelNumber`(신발 조회), `/edit/:crimeNumber`·`/shoesEdit/:modelNumber`(레거시 편집), `/editormode`(독립 편집기).
- `pages/crime-search/model/search-paths.ts` = 경로 빌더 순수 함수 모음(`searchDetailPath`·`resultDetailPath` 등). URL은 이 빌더로 조립.

---

## 5. 레거시 공존 (이행 중) — 모방 금지

FSD 정본과 레거시가 섞여 있다. **기존 레거시를 모방하지 말고 위 정본으로**, 손대는 도메인부터 이동한다.

- **레거시 잔존**: `src/components/*.jsx`(SearchResults·PartialPatterns·PatternList·FormList·ImageLoader·Header 등 — `ShoesRegisterMain`이 아직 사용), `src/services/*.js`(§api-communication), `src/utils/*.js`, `src/hooks/*.js`, `src/pages/*.jsx`(CrimeEdit·EditorMode·ShoesEdit·ShoesRegister), `src/App.jsx`.
- **공유 레거시 삭제 주의**: `PatternList`·`FormList` 등은 여러 화면이 공유 → 삭제 전 `grep`로 전역 참조 확인. "이 화면 전용"만 제거.
- FSD 대체품이 이미 있는 것: 레거시 `SearchResults`→`features/crime-search/ui/SearchResults`, `PartialPatterns`→`PartialPatternsCompare`, `PatternInfo/PatternItem`→`PatternZones`, `PatternList`→`PatternPalette`.

---

## 6. "새 코드 어디에 둘까" — 요약

- **새 읽기쿼리** → `entities/{도메인}/api/*.ts` (`useQuery` + fetcher 동거) → `@docs/api-communication.md`.
- **새 뮤테이션·사용자 액션** → `features/{도메인}/`.
- **도메인 표시 UI(카드·차트·뱃지)** → `entities/{도메인}/ui`. **여러 feature 조합** → `widgets/`. **라우트 엔트리** → `pages/`.
- **범용 UI 껍데기·유틸** → `shared/ui`·`shared/lib`. 전역 상태 → store(현재는 `entities/crime/model`의 crime-store가 사실상 전역).
- **문양·좌표를 다루는 코드**는 반드시 `@docs/pattern-data-model.md`의 불변식을 먼저 확인.

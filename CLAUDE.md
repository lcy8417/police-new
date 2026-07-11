# CLAUDE.md — 경찰 신발자국(족적) 매칭 프론트엔드

> **얇은 헌법**: 아키텍처·통신·문양 데이터 정본은 아래 `@import` 3종(항상 로드)이 소유한다. **이 파일은 그 내용을 중복 서술하지 않는다** — 치명적 규칙·문서에 없는 것만 인라인.

## 개요

경찰 수사 증거 처리를 위한 **법과학 신발자국 매칭 시스템**의 React 프론트엔드. 흐름: 현장 이미지 등록 → 밑창 문양(패턴) 추출 → 신발 DB 매칭 검색 → 유사도 비교 → 결과를 사건 이력에 저장. 무거운 처리(패턴 추출·이미지 검색·각도 보정·유사도)는 모두 **별도 FastAPI 백엔드**가 수행하며, 이 저장소는 HTTP로 통신하는 순수 클라이언트다.

## 아키텍처 정본 (@import — 항상 로드)

@docs/architecture.md
@docs/api-communication.md
@docs/pattern-data-model.md

- 위 3종 = **FSD 배치·Zustand·라우팅 / 백엔드 통신·이미지·좌표 계약 / 문양 데이터 모델·경로** 정본.
- 과거 교훈·결정·선호는 자동 메모리(`MEMORY.md` + `memory/*.md`, 세션 시작 시 로드).

## WHAT — 스택

React + TypeScript + Vite / shadcn/ui + Tailwind 4 / React Router v7 / TanStack Query v5 / Zustand / Vitest.

- **점진 이행 중**: 순수 JS 앱에서 TS + FSD로 마이그레이션 중이라 `.jsx` 레거시(`components/`·`services/`·`utils/`·일부 `pages/`·`App.jsx`)가 TS FSD 슬라이스와 공존. **신규는 FSD·TS로, 레거시 모방 금지** → `@docs/architecture.md` §5.
- FSD 계층 단방향: `app → pages → widgets → features → entities → shared` (상위가 하위만 import, features↔features cross-import 금지). **상세 → `@docs/architecture.md`.**

## HOW — 명령어

```bash
npm run dev      # Vite 개발 서버(--host, LAN 접근)
npm run build    # 프로덕션 빌드(Vite 전용 — 타입검증 미포함)
npm run preview
npm run lint     # ESLint (flat config: eslint.config.js)
npx tsc --noEmit # 타입 검증(빌드와 별도)
npx vitest run   # 테스트 (단일: npx vitest run <file> | -t "패턴")
```

- **작업 완료 전 검증 3종**: `npx tsc --noEmit` + `npx vitest run` + `npm run build`. 여기에 변경 파일 `npx eslint`까지 통과해야 완료.
- `.env`의 `VITE_API_URL`이 백엔드를 가리켜야 함(예 `http://localhost:8000`). 아니면 fetch가 조용히 실패.

## 치명적 인라인 규칙 (실패대비 — 문서 로드 실패해도 지킬 것)

- **문양추출 좌표**: `line_ys`·`render_size`는 **정수 + `[1, renderH-1]` clamp**. 소수 → `int_from_float`(422), 범위 초과 → `tile cannot extend outside image`(500)로 백엔드 크래시. `PatternCanvas`의 좌표 수학(`recompute`/`toCanvasY`/canvas 사이징)·`extractPattern` 전송은 **절대 변경 금지**. (상세 → `@docs/api-communication.md` §4)
- **패턴 표현 이중성**: crime 문양 = `[경로, 필수플래그]` 튜플 / shoe 문양 = 문자열. 중복·삽입 비교는 **경로가 아니라 이름(`stripPatternPath`) 기준**. (상세 → `@docs/pattern-data-model.md`)
- **두 API 규약**: CRUD(`services/crud.js`·`entities/*/api`)는 camelCase 변환, 이미지(`services/api.js`)는 무변환. (상세 → `@docs/api-communication.md` §2)
- **이미지 POST 전** `data:image/...;base64,` 접두어 제거(`stripDataUrl`).

## 스타일링 — Tailwind 전용 · forensic 다크

- **손으로 쓴 `.css` 금지**(정본은 `src/index.css`의 Tailwind 엔트리 하나뿐). 슬라이스 마이그레이션 시 그 화면 전용 `.css` 삭제. 전역 규약(스크롤바 등)만 `index.css @layer`에.
- **인라인 `style={{}}` 금지**(단, 좌표 파생 위치값 `top/left/width/height`처럼 런타임 계산이 불가피한 경우만 예외 — 색·간격은 Tailwind).
- 다크 forensic 커맨드센터 팔레트(하드코딩 hex이 관례): 패널 `#0B121D`, 보더 `#1E2A3C`, 액센트 blue `#4A9EFF`/`#3B82F6`, 필수/경계 레드 `#EF4444`, 소스 teal `#2DD4BF`. `TechCorners`·`DotGrid`/`GlowOrb`(shared/ui)로 시그니처 통일.
- 순수 장식 오버레이는 `pointer-events-none` — 캔버스 좌표 판정을 절대 막지 않는다.

## 명명 & 임포트

- **파일명**: 컴포넌트 `PascalCase.tsx` / 훅·유틸·model `kebab-case.ts` / 폴더 `kebab-case`.
- 식별자: 변수·함수·훅 `camelCase` / 타입·컴포넌트 `PascalCase` / 상수 `UPPER_SNAKE_CASE`. 핸들러 `handle{Event}`(내부)·`on{Event}`(Props). Props는 `interface`.
- `@/` 별칭만(상대 `../../` 지양). 슬라이스는 배럴(`@/entities/crime`)로만 공개, deep-import 지양.

## 유지해야 할 규약

- **타임존 KST 하드코딩**: `toKstIso`(`shared/lib`) 또는 `+09:00` 치환. 새 타임스탬프도 이 방식.
- **주석·UI 문자열·커밋 메시지는 한국어**(기술 식별자·type prefix는 원형 유지). 모드 토글은 enum이 아니라 한국어 문자열 리터럴(예 `"이진화보기"`·`"유사부위표출보기"`) — 기존 리터럴과 정확히 일치.
- **작업 즉시 커밋**: 여러 파일에 걸친 생성 작업은 검증 직후 커밋(이 저장소는 브랜치+reset 워크플로우라 미커밋 워킹트리가 유실되기 쉬움).

## 테스트

- Vitest. 순수 함수(좌표 `line-geometry`, 변환 `case`/`kst`, `use-debounced-value`, 패턴 `pattern`) 위주 단위테스트. `.test.ts`는 소스와 **같은 폴더**(colocate).

## OMC 참고

`.claude/CLAUDE.md`는 oh-my-claudecode가 관리하는 설정 파일(`<!-- OMC:START/END -->` 마커)이다 — 이 프로젝트 문서가 **아니며** 직접 수정 금지. 코드베이스 가이드는 저장소 루트의 이 `CLAUDE.md`다.

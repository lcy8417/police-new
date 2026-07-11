# docs/ — 아키텍처 정본

## 정본 3종 (CLAUDE.md가 `@import` — 항상 로드)

- **architecture.md** — FSD 계층·의존방향·슬라이스 세그먼트·Zustand store·라우팅·레거시 공존
- **api-communication.md** — 별도 FastAPI 백엔드와의 HTTP 통신·**두 API 계층(camelCase 변환/무변환)**·이미지 base64 파이프라인·문양추출 좌표 계약·검색 재검색 규약
- **pattern-data-model.md** — 네 부위(top/mid/bottom/outline)·**crime 튜플 vs shoe 문자열**·패턴 경로 hydrate/strip·문양 UI 컴포넌트

이 3종은 `CLAUDE.md` 상단에서 `@docs/*.md`로 인라인되어 매 코드작업에 항상 로드된다.
중복은 **"한 사실 = 한 주인 + 포인터"**로 정리: 배치=architecture / 통신·좌표=api-communication / 문양 표현·경로=pattern-data-model.

## 다른 정본 위치

| 찾는 것 | 위치 |
|---|---|
| 스택·명령어·치명 규칙·스타일·명명·테스트 | 저장소 루트 `CLAUDE.md` |
| 과거 교훈·결정·선호 | 자동 메모리 `MEMORY.md` + `memory/*.md`(세션 시작 시 로드) |
| OMC 오케스트레이션 설정 | `.claude/CLAUDE.md`(OMC 관리 — 직접 수정 금지) |

> ⚠ 이 폴더 루트엔 architecture/api-communication/pattern-data-model 외 새 "정본"을 만들지 말 것(정본 분산·동기화 붕괴 방지).

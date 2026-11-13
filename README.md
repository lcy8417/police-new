# police-new — 족적(신발자국) 감정 플랫폼 프론트엔드

사건 등록 → 이미지 편집 → 문양 추출 → 신발 검색 → Top-10 대응 부위 확인까지를 다루는 **React 웹 화면**입니다.
모든 데이터·AI 처리는 백엔드 [`lcy8417/police-server`](https://github.com/lcy8417/police-server)(FastAPI)가 담당하므로, **백엔드를 먼저 설치·실행**해야 합니다. 백엔드의 DB·데이터·모델 가중치 설치는 police-server README를 따르세요.

```
[브라우저] ──▶ police-new (Vite, :5173) ──중계(HTTPS)──▶ police-server (FastAPI, :8000) ──▶ PostgreSQL
```

브라우저는 프론트 주소(`:5173`) 하나만 보고, Vite 개발·미리보기 서버가 `/crime`·`/shoes`·`/auth`·`/admin`·`/files`·이미지 요청을 백엔드로 넘깁니다(같은 주소 중계). 그래서 로그인 쿠키가 막히지 않고 CORS 설정도 필요 없습니다.

## 준비물

| 항목 | 요구 사항 |
|---|---|
| Node.js | **20 LTS 이상** 권장 (Vite 6은 Node 18 이상 필요) |
| 백엔드 | police-server가 실행 중이어야 함 |

## 설치 · 실행

```bash
git clone https://github.com/lcy8417/police-new.git
cd police-new
npm ci                          # package-lock.json 그대로 의존성 설치
copy .env.example .env          # Linux/macOS: cp .env.example .env
npm run dev                     # http://localhost:5173
```

### `.env`

| 키 | 예시 | 설명 |
|---|---|---|
| `VITE_API_URL` | (빈 값, 권장) | 비우면 같은 주소 중계를 씁니다. 백엔드 주소를 직접 쓰려면 `https://<서버IP>:8000` — 이때는 서버 `.env`에 `COOKIE_SAMESITE=none`·`COOKIE_SECURE=true`가 필요합니다 |
| `VITE_PROXY_TARGET` | `https://localhost:8000` | 중계 대상 police-server 주소. 다른 PC의 서버면 `https://<서버IP>:8000`, 터널을 쓰면 터널 주소. 자체 서명 인증서여도 됩니다 |

`.env`를 바꾼 뒤에는 `npm run dev`를 다시 실행해야 반영됩니다.

> `VITE_API_URL`을 비운 중계 방식에서는 브라우저가 백엔드 인증서를 직접 보지 않으므로 별도 허용 절차가 필요 없습니다. 주소를 분리한 경우에만, 브라우저에서 `https://<서버>:8000/docs`를 한 번 열어 **"계속 진행"** 으로 허용하세요.

### 처음 로그인

앱을 열면 로그인 화면(`/login`)이 먼저 나옵니다. **첫 계정은 서버에서 만든 관리자 계정**입니다(police-server README의 관리자 계정 만들기 절차). 관리자로 로그인하면 사이드바 **ADMIN → 사용자·권한**(`/manage/users`)에서 다른 사용자를 추가하고 기능 권한(사건 등록·사건 조회·신발 조회·신발 등록·수정)을 켜고 끌 수 있고, **사용 기록**(`/manage/logs`)에서 로그인·기능 사용 기록을 볼 수 있습니다. 새 사용자는 첫 로그인 때 임시 비밀번호를 새 비밀번호로 바꿉니다.

## 명령어

| 명령 | 내용 |
|---|---|
| `npm run dev` | 개발 서버 (같은 네트워크의 다른 PC에서도 접속 가능 — `--host`) |
| `npm run build` | 배포용 빌드 → `dist/` |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` / `npm run typecheck` | 코드 검사 / 타입 검사 |
| `npm test` | 단위 테스트 (Vitest) |
| `npm run test:e2e` | E2E 테스트 (Playwright, 처음엔 `npx playwright install` 필요) |

## 문서

- [`docs/사용자-매뉴얼.md`](docs/사용자-매뉴얼.md) — 화면 사용법 (사건 등록 → 검색 → 유사부위 표출)
- [`docs/architecture.md`](docs/architecture.md) — 폴더 구조(FSD 계층)·상태 관리·라우팅
- [`docs/api-communication.md`](docs/api-communication.md) — 백엔드 API 통신 규약
- [`docs/pattern-data-model.md`](docs/pattern-data-model.md) — 문양 데이터 표현

## 문제 해결

| 증상 | 해결 |
|---|---|
| 목록이 비어 있고 콘솔에 `net::ERR_CERT_AUTHORITY_INVALID` | 위 인증서 허용 절차 진행 |
| 콘솔에 `Failed to fetch` / 중계 오류(502·504) | 백엔드 실행 여부, `VITE_PROXY_TARGET` 주소·포트 확인 |
| 로그인 후 바로 로그인 화면으로 돌아옴 | `VITE_API_URL`을 비웠는지 확인(주소를 분리했다면 서버 쿠키 설정 필요) |
| 메뉴가 하나도 없고 "권한이 없습니다" | 관리자에게 기능 권한을 받아야 합니다(`/manage/users`) |

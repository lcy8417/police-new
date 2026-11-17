# police-new — 족적(신발자국) 감정 플랫폼 프론트엔드

의뢰 접수 → 사건 등록 → 이미지 편집 → 문양 추출 → 신발 검색 · 대조 → 판정 · 교차 검증 · 감정서까지를 다루는 **React 웹 화면**입니다.
모든 데이터 · AI 처리는 백엔드 [`lcy8417/police-server`](https://github.com/lcy8417/police-server)(FastAPI)가 담당하므로, **백엔드를 먼저 설치 · 실행**해야 합니다. 백엔드의 DB · 가중치 · 신발 이미지 설치는 police-server README를 따르세요.

```
[브라우저] ──▶ police-new (Vite, :5173) ──중계(HTTPS)──▶ police-server (FastAPI, :8000) ──▶ PostgreSQL
```

브라우저는 프론트 주소(`:5173`) 하나만 보고, Vite 개발 · 미리보기 서버가 API와 그림 요청을 백엔드로 넘깁니다(같은 주소 중계). 그래서 로그인 쿠키가 막히지 않고 CORS 설정도 필요 없습니다.

---

## 폴더 구조 (요약)

```
police-new/
├── src/
│   ├── App.jsx            라우터(화면 주소 목록)
│   ├── app/               부팅 · 프로바이더(TanStack Query 등)
│   ├── pages/             화면 단위 — cases(사건관리 · 검색 · 대조), crime-register, login, manage-users · manage-logs, dev(진열 화면)
│   ├── widgets/           화면 셸 · 큰 조립 단위(검색 결과 등)
│   ├── features/          사용자 동작 · 상태 · 쓰기 요청
│   ├── entities/          도메인 타입 · 읽기 쿼리 · 표시 부품(crime · shoe · pattern …)
│   ├── shared/            공용 부품(ui) · API 호출(backendFetch) · 도구 함수
│   └── components/ services/ utils/ hooks/   옛 JS 코드(점진 이행 중)
├── docs/                  설계 · 통신 규약 · 사용자 매뉴얼
├── scripts/ui/            화면 규칙 검사(색 토큰 · 부품 목록 · 외부 주소 0)
├── scripts/smoke/         실제 서버 상대 관통 검사
├── tests/                 Playwright(e2e · 화면 비교)
├── vite.config.js         개발 · 미리보기 서버 + 백엔드 중계 규칙
└── dist/                  `npm run build` 결과(배포용, git 제외)
```

자세한 배치 규칙은 [`docs/architecture.md`](docs/architecture.md)(FSD 계층), 백엔드 통신 규약은 [`docs/api-communication.md`](docs/api-communication.md).

---

## 준비물

| 항목 | 요구 사항 |
|---|---|
| Node.js | **20 LTS 이상**(22 LTS 검증) — Vite 6은 Node 18 이상 필요 |
| 백엔드 | police-server가 실행 중이어야 함 |

---

## `.env`

```bash
copy .env.example .env          # Linux/macOS: cp .env.example .env
```

| 키 | 권장 값 | 설명 |
|---|---|---|
| `VITE_API_URL` | **(빈 값)** | 비우면 같은 주소 중계(권장). 백엔드 주소를 직접 쓰려면 `https://<서버IP>:8000` — 이때는 서버 `.env`에 `COOKIE_SAMESITE=none` · `COOKIE_SECURE=true`가 필요하고 브라우저 쿠키 차단에 걸릴 수 있습니다 |
| `VITE_PROXY_TARGET` | `https://localhost:8000` | 중계 대상 police-server 주소. 다른 PC의 서버면 `https://<서버IP>:8000`. 자체 서명 인증서여도 됩니다. 서버를 `http://`로 켰으면 `http://…` |
| `HTTPS_CERT_FILE` · `HTTPS_KEY_FILE` | `../police-server/cert.pem` · `../police-server/key.pem` | **둘 다 적으면 개발 · 미리보기 서버가 `https://`로 뜹니다**(운영 권장 — 서버 `.env`의 `COOKIE_SECURE=true`와 짝. 화면은 http인데 `COOKIE_SECURE=true`면 로그인이 바로 풀림). 비우면 http. 경로는 이 폴더 기준, 서버의 자체 서명 인증서를 그대로 써도 됩니다 |

- 중계되는 것: API(`/crime` · `/shoes` · `/auth` · `/admin` · `/files` · `/requests` · `/codes` · `/review-steps` · `/report-versions`)와 그림(`/crime_images/` · `/crime_history/` · `/crime_outlines/` · `/shoes_images/` 등 — 목록은 `vite.config.js`의 `BACKEND_STATIC_PREFIXES`).
- 서버가 그림을 어느 폴더(다른 드라이브 등)에 두든 그림 주소는 같으므로 프론트 설정은 바꾸지 않습니다.
- `.env`를 바꾼 뒤에는 개발 · 미리보기 서버를 다시 켜야 반영됩니다. `VITE_API_URL`은 **빌드할 때** 결과물에 들어가므로 바꾸면 다시 빌드합니다.

---

## 실행

### 개발

```bash
npm ci                          # package-lock.json 그대로 의존성 설치(처음 한 번)
npm run dev                     # http://localhost:5173 (같은 네트워크의 다른 PC도 접속 가능 — --host)
```

### 빌드 · 운영 실행

**현재 운영 방식 = 빌드 결과(`dist/`)를 Vite 미리보기 서버(`vite preview`)로 내주는 것**입니다. 미리보기 서버가 개발 서버와 같은 중계 규칙(`vite.config.js`의 `preview.proxy`)을 가지고 있어 로그인 쿠키 · 그림이 그대로 동작합니다.

```bash
npm run build                   # → dist/ (끝에 「외부 주소 검사 통과」가 찍혀야 함)
npx vite preview --host --port 5173
```

- `npm run preview`도 같은 일을 합니다(포트 기본 4173 — 위처럼 `--port 5173`을 주면 서버 `ALLOWED_ORIGINS` 기본값과 맞음).
- 브라우저가 여는 주소(예 `https://192.168.0.10:5173`)를 서버 `.env`의 `ALLOWED_ORIGINS`에 넣어야 저장 · 수정이 됩니다(서버 README 6-1).
- IIS · nginx 같은 다른 정적 서버로 `dist/`만 내줄 수도 있지만, 그때는 `vite.config.js`의 중계 규칙(API 경로 · 그림 폴더)을 그 서버에 똑같이 옮겨야 합니다 — 권장하지 않습니다.

### 화면 주소

| 주소 | 내용 |
|---|---|
| `/login` | 로그인(첫 계정은 서버에서 만든 관리자) |
| `/cases` | **실제 업무 화면** — 사건관리(의뢰 목록 · 사건 창 · 검색 · 대조 · 판정), `/cases?shoe=1` 신발 DB |
| `/crimeRegister` | 사건 등록 |
| `/manage/users` · `/manage/logs` | 관리자 — 사용자 · 권한, 사용 기록 |
| `/dev` · `/dev/s00` … `/dev/s14` · `/dev/parts` | **진열 화면**(가짜 자료로 화면 · 부품을 보는 곳). **개발 실행(`npm run dev`)에서만** 있고 빌드 결과에는 들어가지 않음 |

### 처음 로그인

앱을 열면 로그인 화면이 먼저 나옵니다. **첫 계정은 서버에서 만든 관리자 계정**입니다(police-server README 6-3). 관리자로 로그인해 `/manage/users`에서 다른 사용자를 추가하고 기능 권한을 켭니다. 새 사용자는 첫 로그인 때 임시 비밀번호를 새 비밀번호로 바꿉니다.

---

## 내부망(인터넷 없음) 오프라인 꾸러미

운영 PC에서 아무것도 내려받지 않도록, **인터넷 되는 준비 PC(운영 PC와 같은 OS · CPU)** 에서 꾸러미를 만들어 옮깁니다. 자세한 절차는 police-server `docs/operations/airgap-install.md` §3.

**A — 빌드한 폴더 통째로(권장).** esbuild · rollup · Tailwind 등이 OS별 실행 파일이라 같은 OS에서 만들어야 합니다.

```bash
# 준비 PC — 운영 PC에 깔 Node.js와 같은 주 버전
npm ci
npm run build                   # 「외부 주소 검사 통과(소스 + dist)」 확인
# police-new 폴더 통째로(node_modules · dist 포함) 압축해 옮긴다
```

```bash
# 운영 PC — Node.js 설치본(msi/pkg) 먼저
copy .env.example .env          # VITE_API_URL= (빈 값), VITE_PROXY_TARGET=https://localhost:8000
npx vite preview --host --port 5173
```

**B — 운영 PC에서 설치 · 빌드해야 할 때(npm 캐시 꾸러미).**

```bash
# 준비 PC: 캐시 폴더를 지정해 한 번 설치 → 캐시에 모든 패키지가 담김
npm ci --cache ./npm-cache
# 저장소(node_modules 제외) + npm-cache 폴더를 옮긴다

# 운영 PC
npm ci --offline --cache ./npm-cache
npm run build
```

- 글꼴은 저장소(`src/assets/fonts/`)에 들어 있어 따로 옮길 것이 없습니다.
- 운영 PC에서 `npx playwright install`(검사용 브라우저 내려받기)은 하지 않습니다 — 운영에 필요 없습니다.

---

## 검사 명령

| 명령 | 내용 |
|---|---|
| `npx tsc --noEmit` (`npm run typecheck`) | 타입 검사 |
| `npx vitest run` (`npm test`) | 단위 테스트 |
| `npm run lint` / `npx eslint <파일>` | 코드 검사 |
| `npm run build` | 배포용 빌드 + 외부 주소 검사(`postbuild`) |
| `npm run check:airgap` | 소스 + `dist` 외부 주소 0 확인 |
| `npm run check:ui:static` | 화면 규칙(색 토큰 · 부품 목록 · 외부 주소) |
| `npm run check:ui:visual` | 화면 비교(Playwright — 처음엔 `npx playwright install`, 인터넷 필요) |
| `npm run test:e2e` | E2E 테스트(Playwright) |

작업을 끝내기 전 기본 확인: `npx tsc --noEmit` + `npx vitest run` + `npm run build`(+ 바꾼 파일 eslint).

---

## 문서

- [`docs/사용자-매뉴얼.md`](docs/사용자-매뉴얼.md) — 화면 사용법
- [`docs/architecture.md`](docs/architecture.md) — 폴더 구조(FSD 계층) · 상태 관리 · 라우팅
- [`docs/api-communication.md`](docs/api-communication.md) — 백엔드 API 통신 규약
- [`docs/pattern-data-model.md`](docs/pattern-data-model.md) — 문양 데이터 표현

---

## 문제 해결

| 증상 | 해결 |
|---|---|
| 목록이 비어 있고 콘솔에 `net::ERR_CERT_AUTHORITY_INVALID` | 주소를 분리한 경우만 해당 — 브라우저에서 `https://<서버>:8000/docs`를 한 번 열어 「계속 진행」으로 인증서 허용 |
| 콘솔에 `Failed to fetch` / 중계 오류(502 · 504) | 백엔드 실행 여부, `VITE_PROXY_TARGET` 주소 · 포트 · `http`/`https` 확인 |
| 로그인 후 바로 로그인 화면으로 돌아옴 | `VITE_API_URL`을 비웠는지 확인(주소를 분리했다면 서버 쿠키 설정 필요) |
| 저장 · 수정이 403 「허용되지 않은 요청 출처」 | 브라우저가 연 프론트 주소(포트 포함)를 서버 `ALLOWED_ORIGINS`에 추가 |
| 그림이 깨짐 | 로그인 상태 확인(그림도 로그인 필요), 서버의 그림 폴더 확인(`python scripts/check_setup.py --no-db`) |
| 메뉴가 하나도 없고 「권한이 없습니다」 | 관리자에게 기능 권한을 받아야 합니다(`/manage/users`) |
| `/dev` 주소가 빈 화면 · 로그인으로 감 | 진열 화면은 개발 실행(`npm run dev`)에서만 있습니다 |

# police-new — 족적(신발자국) 감정 플랫폼 프론트엔드

사건 등록 → 이미지 편집 → 문양 추출 → 신발 검색 → Top-10 대응 부위 확인까지를 다루는 **React 웹 화면**입니다.
모든 데이터·AI 처리는 백엔드 [`lcy8417/police-server`](https://github.com/lcy8417/police-server)(FastAPI)가 담당하므로, **백엔드를 먼저 설치·실행**해야 합니다. 백엔드의 DB·데이터·모델 가중치 설치는 police-server README를 따르세요.

```
[브라우저] ──▶ police-new (Vite, :5173) ──HTTPS──▶ police-server (FastAPI, :8000) ──▶ MySQL
```

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
| `VITE_API_URL` | `https://localhost:8000` | police-server 주소. **police-server `.env`의 `URL`과 같은 값**이어야 이미지가 정상 표시됩니다. 다른 PC의 서버면 `https://<서버IP>:8000`, 터널을 쓰면 터널 주소 |

`.env`를 바꾼 뒤에는 `npm run dev`를 다시 실행해야 반영됩니다.

> 백엔드가 직접 만든(self-signed) HTTPS 인증서를 쓰는 경우, 브라우저에서 `https://localhost:8000/docs`를 한 번 열어 **"계속 진행"** 으로 허용해야 화면에서 API 호출이 됩니다.

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
| 콘솔에 `Failed to fetch` / CORS 오류 | 백엔드 실행 여부, `VITE_API_URL` 주소·포트 확인 |
| 이미지만 깨짐 | 백엔드 `URL`과 `VITE_API_URL` 불일치 |

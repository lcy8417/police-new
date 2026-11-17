import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'

/**
 * 백엔드로 중계(proxy)할 API 경로 — 키가 `^`로 시작하면 Vite가 정규식으로 쓴다.
 * `/crime/...`·`/crime?x`·`/auth/me`는 넘기고, 같은 글자로 시작하는 화면 주소
 * (`/crimeRegister`, `/shoesRepository`)는 넘기지 않도록 뒤에 `/`·끝·`?`만 허용한다
 * (설계서 §3-1). 관리자 화면은 `/manage/*`라 `/admin/*` API와 겹치지 않는다.
 * `/files/*`는 증거 파일 API(원본 올리기 `POST /files/original`, 열람 `GET /files/{id}` —
 * 실증 확장 설계서 §5-E · §6-3). 빠지면 POST가 Vite 화면 서버로 가서 404가 된다.
 * B 단계 API 앞부분(서버 설계서 2026-11-17 §4-3 끝): `/requests`(의뢰 — A 단계부터 있었으나 빠져 있었음) ·
 * `/codes`(코드표) · `/review-steps`(교차 검증) · `/report-versions`(감정서 판본). 화면 주소 `/cases`와 겹치지 않는다.
 */
export const BACKEND_PROXY_PATTERN =
  '^/(crime|shoes|auth|admin|files|requests|codes|review-steps|report-versions)(/|$|\\?)'

/** 백엔드 정적 이미지 폴더(로그인 쿠키로 보호됨) — 앞부분이 같으면 중계한다. */
export const BACKEND_STATIC_PREFIXES = [
  '/crime_images/',
  '/crime_history/',
  '/crime_outlines/',
  '/shoes_images/',
  // 신발 썸네일(224px WebP — 서버 scripts/make_shoe_thumbs.py). 검색 결과 카드만 쓰고, 없으면 화면이 원본으로 대신한다
  '/shoes_thumbs/',
]

/**
 * 개발 서버·미리보기 서버 공용 중계 설정. 브라우저는 프론트 주소 하나만 보므로
 * (same-origin) 쿠키가 막히지 않고 CORS도 필요 없다.
 *  - `secure: false`: 백엔드가 자체 서명 인증서(https://localhost:8000)를 쓴다.
 *  - `changeOrigin: false`: 서버의 요청 출처(Origin) 검사가 프론트 주소를 보도록 그대로 둔다.
 */
export function backendProxy(target) {
  return Object.fromEntries(
    [BACKEND_PROXY_PATTERN, ...BACKEND_STATIC_PREFIXES].map((key) => [
      key,
      { target, secure: false, changeOrigin: false },
    ])
  )
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `.env`의 VITE_PROXY_TARGET을 읽는다(이미 설정된 환경변수가 우선).
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = process.env.VITE_PROXY_TARGET ?? env.VITE_PROXY_TARGET ?? 'https://localhost:8000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      // FSD layer alias: `@/shared/...`, `@/entities/...`, etc.
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: backendProxy(proxyTarget),
      watch: {
        // 개발 도구(MoAI/OMC/Claude Code)가 프로젝트 안 상태 폴더에 몇 초마다
        // 파일을 다시 쓰는데(예: .moai/state/context-usage.json), Vite가 이를
        // 감지해 전체 페이지를 반복 새로고침한다. 소스가 아닌 이 폴더들은
        // 감시에서 제외한다(빌드에는 영향 없음).
        ignored: ['**/.moai/**', '**/.omc/**', '**/.claude/**'],
      },
    },
    preview: {
      proxy: backendProxy(proxyTarget),
    },
  }
})

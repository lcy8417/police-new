import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { cpSync, readFileSync } from 'node:fs'
import path from 'node:path'

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

/**
 * 문양 그림을 빌드 결과에 같은 경로로 복사한다.
 * 화면 코드는 문양 그림을 소스 경로 글자(`/src/assets/Patterns/전체/<이름>.png` — entities/pattern `PATTERNS_ROOT`,
 * `import.meta.glob` 키)로 그린다. 개발 서버는 이 경로를 열어 주지만 빌드 + `vite preview`(운영)는 `dist/`만 내주므로
 * 그대로면 그림 대신 index.html 이 와서 깨진다. 경로 글자는 문양 비교 · 저장이 기대는 정본이라 바꾸지 않고(docs/pattern-data-model.md §3),
 * 빌드가 끝날 때 폴더를 `dist/src/assets/Patterns/`로 옮겨 같은 주소가 열리게 한다.
 */
function copyPatternAssets() {
  let outDir = 'dist'
  let root = process.cwd()
  return {
    name: 'copy-pattern-assets',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      cpSync(path.join(root, 'src/assets/Patterns'), path.join(outDir, 'src/assets/Patterns'), { recursive: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `.env`의 VITE_PROXY_TARGET을 읽는다(이미 설정된 환경변수가 우선).
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = process.env.VITE_PROXY_TARGET ?? env.VITE_PROXY_TARGET ?? 'https://localhost:8000'
  // 화면을 https:// 로 열 때(운영 — 서버 COOKIE_SECURE=true 와 짝): `.env`에 인증서 · 키 파일 경로를 둘 다 적으면
  // 개발 서버 · 미리보기 서버가 HTTPS 로 뜬다. 비우면 지금처럼 http. 경로는 이 폴더 기준(서버의 cert.pem 을 그대로 써도 됨).
  // VITE_ 접두어를 붙이지 않는다(화면 번들에 들어가지 않게).
  const certFile = process.env.HTTPS_CERT_FILE ?? env.HTTPS_CERT_FILE
  const keyFile = process.env.HTTPS_KEY_FILE ?? env.HTTPS_KEY_FILE
  const https = certFile && keyFile ? { cert: readFileSync(certFile), key: readFileSync(keyFile) } : undefined

  return {
    plugins: [react(), tailwindcss(), copyPatternAssets()],
    resolve: {
      // FSD layer alias: `@/shared/...`, `@/entities/...`, etc.
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      https,
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
      https,
      proxy: backendProxy(proxyTarget),
    },
  }
})

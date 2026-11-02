import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // FSD layer alias: `@/shared/...`, `@/entities/...`, etc.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    watch: {
      // 개발 도구(MoAI/OMC/Claude Code)가 프로젝트 안 상태 폴더에 몇 초마다
      // 파일을 다시 쓰는데(예: .moai/state/context-usage.json), Vite가 이를
      // 감지해 전체 페이지를 반복 새로고침한다. 소스가 아닌 이 폴더들은
      // 감시에서 제외한다(빌드에는 영향 없음).
      ignored: ['**/.moai/**', '**/.omc/**', '**/.claude/**'],
    },
  },
})

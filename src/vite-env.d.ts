/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL consumed by services/api.js and services/crud.js. */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

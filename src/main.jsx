import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { AppProviders } from "@/app/providers";
import { SessionProvider } from "@/features/auth";
import App from "./App.jsx";

// 렌더 순서: AppProviders → BrowserRouter → SessionProvider → App.
// SessionProvider가 라우터 안에 있어야 세션 확인 결과로 화면을 옮길 수 있다(`/login`·`/password`).
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders>
      <BrowserRouter>
        <SessionProvider>
          <App />
        </SessionProvider>
      </BrowserRouter>
    </AppProviders>
  </StrictMode>
);

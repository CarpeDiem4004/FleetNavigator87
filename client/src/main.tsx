import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
import "./hide-error.css"; // CSS para esconder mensagens de erro do Vite
// import "./utils/external-deployment-fix"; // Temporariamente desabilitado

// Initialize PWA for both development and production with better error handling
const initPWA = async () => {
  try {
    const { pwaManager } = await import('./utils/pwa-utils');
    console.log('[PWA] Manager initialized successfully');
  } catch (error) {
    console.warn('[PWA] Service Worker registration skipped:', (error as Error).message);
  }
};

// Initialize PWA regardless of environment
initPWA();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

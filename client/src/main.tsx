import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hide-error.css"; // CSS para esconder mensagens de erro do Vite

// Initialize PWA for both development and production with better error handling
const initPWA = async () => {
  try {
    const { pwaManager } = await import('./utils/pwa-utils');
    console.log('[PWA] Manager initialized successfully');
  } catch (error) {
    console.warn('[PWA] Service Worker registration skipped:', error.message);
  }
};

// Initialize PWA regardless of environment
initPWA();

createRoot(document.getElementById("root")!).render(
  <App />
);

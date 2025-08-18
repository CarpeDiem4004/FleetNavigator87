import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hide-error.css"; // CSS para esconder mensagens de erro do Vite

// Initialize PWA only in production to avoid development errors
if (import.meta.env.PROD) {
  import('./utils/pwa-utils').then(({ pwaManager }) => {
    console.log('[PWA] Manager initialized');
  }).catch(error => {
    console.error('[PWA] Service Worker registration failed:', error);
  });
}

createRoot(document.getElementById("root")!).render(
  <App />
);

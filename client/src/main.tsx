import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hide-error.css"; // CSS para esconder mensagens de erro do Vite

// Initialize PWA only in production or when explicitly enabled
if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_PWA === 'true') {
  import('./utils/pwa-utils').then(({ pwaManager }) => {
    console.log('[PWA] Manager initialized');
  }).catch(error => {
    console.warn('[PWA] Failed to initialize:', error);
  });
}

createRoot(document.getElementById("root")!).render(
  <App />
);

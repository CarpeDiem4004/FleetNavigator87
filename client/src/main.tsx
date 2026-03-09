import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hide-error.css"; // CSS para esconder mensagens de erro do Vite

// Desregistrar Service Workers problemáticos para evitar erros de cache no mobile
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      console.log('[SW] Desregistrando Service Worker:', reg.scope);
      reg.unregister();
    });
  }).catch(err => {
    console.warn('[SW] Erro ao desregistrar Service Workers:', err);
  });
}

createRoot(document.getElementById("root")!).render(
  <App />
);

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hide-error.css"; // CSS para esconder mensagens de erro do Vite

createRoot(document.getElementById("root")!).render(
  <App />
);

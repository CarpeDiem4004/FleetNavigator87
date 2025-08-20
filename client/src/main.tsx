// NEUTRALIZAR TODAS AS FUNÇÕES REACT FAST REFRESH
if (typeof window !== 'undefined') {
  (window as any).$RefreshSig$ = () => (type: any) => type;
  (window as any).$RefreshReg$ = () => {};
  (window as any).$RefreshRegs$ = () => {}; // ADICIONAR ESTA NOVA FUNÇÃO
}

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
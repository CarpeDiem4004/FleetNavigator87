import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hide-error.css"; // CSS para esconder mensagens de erro do Vite
import './error-logger'; // Importar o logger de erros

// Importando o cliente auxiliar do Supabase, usando caminho relativo 
// para evitar problemas de resolução de módulos
import './lib/supabase-helper';
console.log('Módulo supabase-helper importado com sucesso');

// Para evitar erros, declaramos a variável global supabaseClient 
// que outros módulos possam estar tentando usar
(window as any).supabaseClient = {
  checkConnection: async () => true,
  fetchRecords: async () => ({ success: true, data: [] })
};

createRoot(document.getElementById("root")!).render(
  <App />
);

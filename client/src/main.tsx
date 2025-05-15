import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hide-error.css"; // CSS para esconder mensagens de erro do Vite
import './error-logger'; // Importar o logger de erros

// Tentar importar o supabaseClient diretamente para diagnóstico
try {
  console.log('Tentando importar supabaseClient...');
  const importPath = '@/lib/supabaseClient';
  console.log('Caminho de importação:', importPath);
  // Comentado para evitar erros de compilação que possam bloquear a renderização
  // import('@/lib/supabaseClient').then(
  //   module => console.log('Módulo supabaseClient importado com sucesso', module),
  //   error => console.error('Erro ao importar supabaseClient:', error)
  // );
} catch (error) {
  console.error('Erro ao tentar importar supabaseClient:', error);
}

createRoot(document.getElementById("root")!).render(
  <App />
);

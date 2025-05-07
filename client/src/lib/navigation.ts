/**
 * Utilitário de navegação que fornece métodos robustos para navegação no aplicativo
 * Este utilitário ajuda a resolver problemas comuns com o router wouter
 */

/**
 * Navega para uma URL específica usando múltiplos métodos para garantir confiabilidade
 * @param url Caminho para navegar (e.g. '/posto-murici')
 */
export function navigateTo(url: string): void {
  console.log(`Navegando para: ${url} via utilidade robusta`);
  
  // Método 1: usando wouter via window.history + popstate event
  try {
    window.history.pushState(null, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
    console.log(`Método 1 (wouter) executado para ${url}`);
  } catch (error) {
    console.error("Erro no método 1 de navegação:", error);
  }
  
  // Método 2: setando location.href com delay
  setTimeout(() => {
    try {
      window.location.href = url;
      console.log(`Método 2 (location.href com delay) executado para ${url}`);
    } catch (error) {
      console.error("Erro no método 2 de navegação:", error);
    }
  }, 50);
  
  // Método 3: usando assign como fallback final
  setTimeout(() => {
    try {
      window.location.assign(url);
      console.log(`Método 3 (location.assign) executado para ${url}`);
    } catch (error) {
      console.error("Erro no método 3 de navegação:", error);
      
      // Método 4: último recurso - recarregar para URL
      try {
        window.location.replace(url);
        console.log(`Método 4 (location.replace) executado para ${url}`);
      } catch (finalError) {
        console.error("Todos os métodos de navegação falharam:", finalError);
      }
    }
  }, 100);
}

// Exportar como default também para facilitar importação
export default navigateTo;
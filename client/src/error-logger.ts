/**
 * Este arquivo é usado para capturar e registrar erros durante a inicialização
 */

// Função para registrar erros no console de maneira mais detalhada
export function logInitError(error: any, context?: string) {
  console.error('=== ERRO DE INICIALIZAÇÃO ===');
  console.error(`Contexto: ${context || 'desconhecido'}`);
  console.error('Detalhes do erro:', error);
  
  // Registrar a stack trace se disponível
  if (error && error.stack) {
    console.error('Stack trace:', error.stack);
  }
  
  // Tentar extrair mais informações
  if (error && typeof error === 'object') {
    console.error('Propriedades adicionais do erro:');
    Object.keys(error).forEach(key => {
      console.error(`- ${key}:`, error[key]);
    });
  }
  
  return error; // Retornar o erro para permitir encadeamento
}

// Inicializar captura de erros global
window.addEventListener('error', (event) => {
  console.error('=== ERRO GLOBAL CAPTURADO ===');
  console.error('Mensagem:', event.message);
  console.error('Arquivo:', event.filename);
  console.error('Linha:', event.lineno);
  console.error('Coluna:', event.colno);
  console.error('Erro:', event.error);
});

// Capturar promises não tratadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('=== PROMISE REJEITADA NÃO TRATADA ===');
  console.error('Razão:', event.reason);
  if (event.reason && event.reason.stack) {
    console.error('Stack trace:', event.reason.stack);
  }
});
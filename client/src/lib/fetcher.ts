/**
 * Função utilitária para fazer requisições HTTP
 * Retorna os dados da resposta JSON ou gera um erro
 */
export async function fetcher(url: string): Promise<any> {
  const res = await fetch(url);
  
  // Se a resposta não for 2xx, gera um erro com a mensagem do servidor
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({
      message: 'Ocorreu um erro inesperado'
    }));
    
    const errorMessage = errorData.message || 'Ocorreu um erro inesperado';
    throw new Error(errorMessage);
  }
  
  return res.json();
}
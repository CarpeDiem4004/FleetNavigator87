/**
 * Função utilitária para fazer requisições HTTP
 * Utilizada com o react-query para buscar dados
 */
export async function fetcher<T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let errorMessage = `Erro ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Se não conseguirmos extrair uma mensagem de erro do JSON, usamos a mensagem padrão acima
    }
    throw new Error(errorMessage);
  }

  // Para requisições DELETE ou outras sem conteúdo
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
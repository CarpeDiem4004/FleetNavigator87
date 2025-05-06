/**
 * API para manipulação de movimentações de pátio
 * Implementa funções para obter movimentações de postos específicos
 * com tratamento especial para postos ABC_v2 que têm uma estrutura diferente
 */

import axios from 'axios';

/**
 * Formata o nome do posto para o formato usado nas APIs
 * @param postoName Nome do posto para formatar
 * @returns Nome formatado
 */
function formatarNomePosto(postoName: string): string {
  if (!postoName) return '';
  
  // Trim e converte para minúsculas
  const nome = postoName.trim().toLowerCase();
  
  // Casos especiais para os postos que usam underscores
  if (nome.includes('abc v2') || nome.includes('abc_v2')) {
    return 'abc_v2';
  } else if (nome.includes('osasco v2') || nome.includes('osasco_v2')) {
    return 'osasco_v2';
  } else if (nome.includes('campinas v2') || nome.includes('campinas_v2')) {
    return 'campinas_v2';
  } else if (nome.includes('socorro v2') || nome.includes('socorro_v2')) {
    return 'socorro_v2';
  } else if (nome.includes('sorocaba v2') || nome.includes('sorocaba_v2')) {
    return 'sorocaba_v2';
  } else if (nome.includes('alair v2') || nome.includes('alair_v2')) {
    return 'alair_v2';
  }
  
  // Formato padrão para outros postos
  return nome.replace(/\s+/g, '_');
}

/**
 * Interface para dados de movimentação
 */
export interface MovimentacaoData {
  id: number;
  placa: string;
  tipo_movimento?: string | null;
  motorista?: string | null;
  motorista_rg?: string | null;
  nome_motorista?: string | null;
  operador?: string | null;
  nome_operador?: string | null;
  posto?: string;
  tipo_veiculo?: string | null;
  km_registrado?: number | null;
  destino?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  data_movimento?: string;
  created_at: string;
  updated_at?: string;
  motivo?: string | null;
  data_entrada?: string | null;
  data_saida?: string | null;
}

/**
 * Busca movimentações de pátio para um posto específico usando a API correta
 * 
 * Tenta diferentes caminhos e formatos de API até obter sucesso
 * 
 * @param posto Nome do posto
 * @returns Dados das movimentações do posto
 */
export async function getMovimentacoesPatio(posto: string): Promise<{
  success: boolean,
  data: MovimentacaoData[],
  count: number,
  message?: string
}> {
  const postoFormatado = formatarNomePosto(posto);
  
  console.log(`[API] Buscando movimentações para ${posto} (formatado: ${postoFormatado})`);
  
  // Lista de URLs a tentar, em ordem de prioridade
  const urlsToTry = [
    // Rota específica para postos v2
    `/api/movimentacoes-patio-direto-${postoFormatado}`,
    
    // Rota genérica para movimentações
    `/api/movimentacoes-patio-direto/${postoFormatado}`,
    
    // Última tentativa: rota regular (pode ser interceptada pelo Vite)
    `/api/movimentacoes-patio/${postoFormatado}`
  ];
  
  // Adiciona timestamp para evitar cache
  const timestamp = Date.now();
  
  // Filtrar rotas que não se aplicam ao posto específico
  const filteredUrls = urlsToTry;
  
  // Resultado padrão para erro
  const errorResult = {
    success: false,
    data: [],
    count: 0,
    message: `Não foi possível obter movimentações para o posto ${posto}`
  };
  
  // Tentativas das URLs em sequência
  for (const baseUrl of filteredUrls) {
    const url = `${baseUrl}?t=${timestamp}`;
    
    try {
      console.log(`[API] Tentando URL: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Verifica se a resposta é um JSON válido
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`[API] Resposta não é um JSON válido. Content-Type: ${contentType}`);
        continue; // Tenta a próxima URL
      }
      
      if (!response.ok) {
        console.warn(`[API] Resposta com status ${response.status}`);
        continue; // Tenta a próxima URL
      }
      
      // Parse da resposta JSON
      const result = await response.json();
      
      // Verifica se a resposta tem o formato esperado
      if (result && typeof result === 'object') {
        if (result.success && Array.isArray(result.data)) {
          console.log(`[API] Sucesso! Encontradas ${result.data.length} movimentações`);
          
          // Normalizar os dados
          const normalizedData = result.data.map((item: any) => ({
            ...item,
            // Garantir compatibilidade nos nomes dos campos
            nome_motorista: item.nome_motorista || item.motorista || '',
            nome_operador: item.nome_operador || item.operador || '',
            posto: result.posto || postoFormatado
          }));
          
          return {
            success: true,
            data: normalizedData,
            count: normalizedData.length,
            message: `Encontradas ${normalizedData.length} movimentações para ${postoFormatado}`
          };
        } else if (result.error) {
          console.warn(`[API] Erro na resposta: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(`[API] Erro ao chamar ${url}:`, error);
    }
  }
  
  // Se chegamos aqui, todas as tentativas falharam
  return errorResult;
}

/**
 * Verifica se a tabela de movimentações existe para um posto específico
 * @param posto Nome do posto
 * @returns Booleano indicando se a tabela existe
 */
export async function verificarTabelaMovimentacoes(posto: string): Promise<boolean> {
  try {
    const postoFormatado = formatarNomePosto(posto);
    const response = await axios.get(`/api/check-tabela-direto/${postoFormatado}?tabela=movimentacoes_patio_${postoFormatado}`);
    
    return response.data && response.data.success && response.data.exists;
  } catch (error) {
    console.error(`Erro ao verificar tabela de movimentações para posto ${posto}:`, error);
    return false;
  }
}
/**
 * Utilitários para manipulação e formatação de dados de postos
 */

/**
 * Formata o nome do posto para um formato padronizado
 * Usado para normalizar os nomes de postos entre diferentes partes do sistema
 * 
 * @param nome Nome do posto para formatar
 * @returns Nome formatado
 */
export function formatarNomePosto(nome: string): string {
  if (!nome) return '';
  
  // Remover espaços extras e converter para lowercase
  const nomeNormalizado = nome.trim().toLowerCase();
  
  // Mapeamento de variações comuns para o formato padrão
  // A partir de Maio/2025, apenas o Posto Remédios é mantido
  const mapeamentoNomes: Record<string, string> = {
    'posto remedios': 'remedios',
    'posto remédios': 'remedios',
    'remédios': 'remedios',
    // Mapeando os outros postos para 'remedios' para redirecionamento automático
    'posto campinas': 'remedios', // Removido: Maio/2025
    'posto são paulo': 'remedios', // Removido: Abril/2025
    'posto sao paulo': 'remedios', // Removido: Abril/2025
    'são paulo': 'remedios', // Removido: Abril/2025
    'sao paulo': 'remedios', // Removido: Abril/2025
    'posto osasco': 'remedios', // Removido: Maio/2025
    'posto abc': 'remedios', // Removido: Maio/2025
    'posto socorro': 'remedios', // Removido: Maio/2025
    'posto sorocaba': 'remedios', // Removido: Maio/2025
    'posto ipatinga': 'remedios', // Removido: Maio/2025
    'posto bota fogo': 'remedios', // Removido: Maio/2025
    'posto botafogo': 'remedios', // Removido: Maio/2025
    'bota fogo': 'remedios', // Removido: Maio/2025
    'posto vargem grande': 'remedios', // Removido: Maio/2025
    'vargem grande': 'remedios', // Removido: Maio/2025
    'posto guarulhos': 'remedios', // Removido: Maio/2025
  };
  
  // Procurar por correspondências exatas
  if (mapeamentoNomes[nomeNormalizado]) {
    return mapeamentoNomes[nomeNormalizado];
  }
  
  // Procurar por correspondências parciais
  for (const [chave, valor] of Object.entries(mapeamentoNomes)) {
    if (nomeNormalizado.includes(chave)) {
      return valor;
    }
  }
  
  // Se não encontrou, retorna 'remedios' como padrão
  // Alterado: Maio/2025 - Redirecionando todos os postos desconhecidos para Remédios
  return 'remedios';
}

/**
 * Verifica se um nome de posto é válido comparando com a lista de postos conhecidos
 * 
 * @param nome Nome do posto para validar
 * @returns boolean indicando se o posto é válido
 */
export function isPostoValido(nome: string): boolean {
  const nomeFormatado = formatarNomePosto(nome);
  
  // Lista de postos válidos no sistema
  // A partir de Maio/2025, apenas o Posto Remédios é considerado válido
  const postosValidos = [
    // Todos os outros postos foram removidos em Maio/2025
    'remedios'
  ];
  
  return postosValidos.includes(nomeFormatado);
}

/**
 * Obtém o nome de exibição formatado para um posto específico
 * 
 * @param nome Nome interno do posto
 * @returns Nome formatado para exibição
 */
export function obterNomeExibicaoPosto(nome: string): string {
  const nomeFormatado = formatarNomePosto(nome);
  
  // Mapeamento de nomes internos para nomes de exibição
  // A partir de Maio/2025, todos os postos (exceto Remédios) são redirecionados para o Posto Remédios
  const mapeamentoExibicao: Record<string, string> = {
    'campinas': 'Posto Campinas (Removido Maio/2025)',
    'osasco': 'Posto Osasco (Removido Maio/2025)',
    'abc': 'Posto ABC (Removido Maio/2025)',
    'socorro': 'Posto Socorro (Removido Maio/2025)',
    'sorocaba': 'Posto Sorocaba (Removido Maio/2025)',
    'saopaulo': 'Posto São Paulo (Removido Abril/2025)',
    'ipatinga': 'Posto Ipatinga (Removido Maio/2025)',
    'botafogo': 'Posto Bota Fogo (Removido Maio/2025)',
    'remedios': 'Posto Remédios',
    'vargemgrande': 'Posto Vargem Grande (Removido Maio/2025)',
    'guarulhos': 'Posto Guarulhos (Removido Maio/2025)'
  };
  
  // Se o posto não for reconhecido, retorna o Posto Remédios
  // como valor padrão após a remoção dos outros postos
  return mapeamentoExibicao[nomeFormatado] || 'Posto Remédios';
}

/**
 * Formata o nome da tabela para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da tabela formatado
 */
export function formatarNomeTabela(posto: string): string {
  return `posto_murici_${formatarNomePosto(posto).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

/**
 * Lista todos os postos conhecidos no sistema
 * 
 * @returns Array com os nomes internos de todos os postos
 */
export function listarTodosPosto(): string[] {
  // A partir de Maio/2025, apenas o Posto Remédios é mantido no sistema
  return [
    'remedios'
  ];
}
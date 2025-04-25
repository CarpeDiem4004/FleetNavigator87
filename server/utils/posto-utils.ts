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
  const mapeamentoNomes: Record<string, string> = {
    'posto remedios': 'remedios',
    'posto remédios': 'remedios',
    'remédios': 'remedios',
    'posto campinas': 'campinas',
    'posto são paulo': 'saopaulo',
    'posto sao paulo': 'saopaulo',
    'são paulo': 'saopaulo',
    'sao paulo': 'saopaulo',
    'posto osasco': 'osasco',
    'posto abc': 'abc',
    'posto socorro': 'socorro',
    'posto sorocaba': 'sorocaba',
    'posto ipatinga': 'ipatinga',
    'posto bota fogo': 'botafogo',
    'posto botafogo': 'botafogo',
    'bota fogo': 'botafogo',
    'posto vargem grande': 'vargemgrande',
    'vargem grande': 'vargemgrande',
    'posto guarulhos': 'guarulhos',
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
  
  // Se não encontrou, retorna o nome original sem espaços e caracteres especiais
  return nomeNormalizado.replace(/[^a-z0-9]/g, '');
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
  const postosValidos = [
    'campinas',
    'osasco',
    'abc',
    'socorro',
    'sorocaba',
    'saopaulo',
    'ipatinga',
    'botafogo',
    'remedios',
    'vargemgrande',
    'guarulhos'
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
  const mapeamentoExibicao: Record<string, string> = {
    'campinas': 'Posto Campinas',
    'osasco': 'Posto Osasco',
    'abc': 'Posto ABC',
    'socorro': 'Posto Socorro',
    'sorocaba': 'Posto Sorocaba',
    'saopaulo': 'Posto São Paulo',
    'ipatinga': 'Posto Ipatinga',
    'botafogo': 'Posto Bota Fogo',
    'remedios': 'Posto Remédios',
    'vargemgrande': 'Posto Vargem Grande',
    'guarulhos': 'Posto Guarulhos'
  };
  
  return mapeamentoExibicao[nomeFormatado] || 
    `Posto ${nome.charAt(0).toUpperCase() + nome.slice(1)}`;
}

/**
 * Formata o nome da tabela para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da tabela formatado
 */
export function formatarNomeTabela(posto: string): string {
  return `abastecimentos_posto_${formatarNomePosto(posto).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

/**
 * Lista todos os postos conhecidos no sistema
 * 
 * @returns Array com os nomes internos de todos os postos
 */
export function listarTodosPosto(): string[] {
  return [
    'campinas',
    'osasco',
    'abc',
    'socorro',
    'sorocaba',
    'saopaulo',
    'ipatinga',
    'botafogo',
    'remedios',
    'vargemgrande',
    'guarulhos'
  ];
}
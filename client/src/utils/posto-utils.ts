/**
 * Utilitários para padronização de operações relacionadas a postos no frontend
 */

/**
 * Lista de postos conhecidos no sistema
 * Esta é a versão padronizada para correspondência com tabelas/views no banco de dados
 */
export const POSTOS_CONHECIDOS: string[] = [
  'campinas',
  'campinas_v2',
  'ribeirao',
  'maceio',
  'caxias',
  'contagem',
  'embu',
  'limeira',
  'remedios',
  'sp',
  'barueri',
  'blumenau',
  'alair',
  'alair_v2',
  'osasco',
  'osasco_v2',
  'abc',
  'abc_v2',
  'socorro_v2',
  'sorocaba_v2'
];

// Alias para compatibilidade
export const formatarNomePosto = formatPostoName;

/**
 * Mapeamento de variações de nome para nome padronizado
 */
export const MAPEAMENTO_POSTOS: Record<string, string> = {
  // Postos internos
  'campinas': 'campinas',
  'posto campinas': 'campinas',
  'cps': 'campinas',
  
  'campinas v2': 'campinas_v2',
  'campinasv2': 'campinas_v2',
  'posto campinas v2': 'campinas_v2',
  'posto_campinas_v2': 'campinas_v2',
  
  'ribeirao': 'ribeirao',
  'ribeirao preto': 'ribeirao',
  'posto ribeirao': 'ribeirao',
  'posto ribeirao preto': 'ribeirao',
  'ribeirão': 'ribeirao',
  'ribeirão preto': 'ribeirao',
  'posto ribeirão': 'ribeirao',
  'posto ribeirão preto': 'ribeirao',
  
  'maceio': 'maceio',
  'posto maceio': 'maceio',
  'maceió': 'maceio',
  'posto maceió': 'maceio',
  
  'caxias': 'caxias',
  'posto caxias': 'caxias',
  'caxias do sul': 'caxias',
  'posto caxias do sul': 'caxias',
  
  'contagem': 'contagem',
  'posto contagem': 'contagem',
  
  'embu': 'embu',
  'posto embu': 'embu',
  'embu das artes': 'embu',
  'posto embu das artes': 'embu',
  
  'limeira': 'limeira',
  'posto limeira': 'limeira',
  
  'remedios': 'remedios',
  'remédios': 'remedios',
  'posto remedios': 'remedios',
  'posto remédios': 'remedios',
  
  'sp': 'sp',
  'são paulo': 'sp',
  'sao paulo': 'sp',
  'posto sp': 'sp',
  'posto são paulo': 'sp',
  'posto sao paulo': 'sp',
  
  'barueri': 'barueri',
  'posto barueri': 'barueri',
  
  'blumenau': 'blumenau',
  'posto blumenau': 'blumenau',
  
  'alair': 'alair',
  'posto alair': 'alair',
  
  'alair_v2': 'alair_v2',
  'alair v2': 'alair_v2',
  'alairv2': 'alair_v2',
  'posto alair v2': 'alair_v2',
  'posto_alair_v2': 'alair_v2',
  
  'osasco': 'osasco',
  'posto osasco': 'osasco',
  
  'osasco_v2': 'osasco_v2',
  'osasco v2': 'osasco_v2',
  'osascov2': 'osasco_v2',
  'posto osasco v2': 'osasco_v2',
  'posto_osasco_v2': 'osasco_v2',
  
  'abc': 'abc',
  'posto abc': 'abc',
  
  'abc_v2': 'abc_v2',
  'abc v2': 'abc_v2',
  'abcv2': 'abc_v2',
  'posto abc v2': 'abc_v2',
  'posto_abc_v2': 'abc_v2',
  
  'socorro_v2': 'socorro_v2',
  'socorro v2': 'socorro_v2',
  'socorrov2': 'socorro_v2',
  'posto socorro v2': 'socorro_v2',
  'posto_socorro_v2': 'socorro_v2',
  
  'sorocaba_v2': 'sorocaba_v2',
  'sorocaba v2': 'sorocaba_v2',
  'sorocabav2': 'sorocaba_v2',
  'posto sorocaba v2': 'sorocaba_v2',
  'posto_sorocaba_v2': 'sorocaba_v2'
};

/**
 * Verifica se o nome do posto é válido
 * @param posto Nome do posto
 * @returns true se o posto for válido, false caso contrário
 */
export function isPostoValido(posto: string): boolean {
  if (!posto) return false;
  
  // Lista de postos desativados
  const postosDesativados = [
    'sorocaba' // Mantemos apenas a versão antiga do posto Sorocaba desativada
  ];
  
  // Normalizando o nome do posto para comparação
  const nomeNormalizado = posto.toString().toLowerCase().trim();
  
  // Verificar se é um posto desativado
  if (postosDesativados.includes(nomeNormalizado)) {
    console.warn(`Posto desativado: ${posto}`);
    return false;
  }
  
  // Consider it valid if it has at least 3 characters
  return posto.trim().length >= 3;
}

/**
 * Formata o nome do posto para o padrão utilizado nas tabelas/views do banco de dados
 * 
 * @param nomePosto - Nome do posto a ser formatado
 * @returns - Nome do posto formatado para uso no banco de dados
 */
export function formatPostoName(nomePosto: string | number): string {
  if (!nomePosto) {
    console.warn('Nome do posto não fornecido para formatPostoName');
    return 'indefinido';
  }
  
  // Converte para minúsculas e remove espaços extras
  const nomeNormalizado = nomePosto.toString().toLowerCase().trim();
  
  // Tenta usar o mapeamento direto
  if (MAPEAMENTO_POSTOS[nomeNormalizado]) {
    return MAPEAMENTO_POSTOS[nomeNormalizado];
  }
  
  // Se não encontrar no mapeamento exato, tenta uma correspondência parcial
  for (const [chave, valor] of Object.entries(MAPEAMENTO_POSTOS)) {
    if (nomeNormalizado.includes(chave)) {
      return valor;
    }
    
    if (chave.includes(nomeNormalizado) && nomeNormalizado.length > 3) {
      return valor;
    }
  }
  
  // Se ainda não encontrou, verifica se está na lista de postos conhecidos
  if (POSTOS_CONHECIDOS.includes(nomeNormalizado)) {
    return nomeNormalizado;
  }
  
  // Retorna o nome normalizado se todas as tentativas falharem
  console.warn(`Nome do posto não encontrado no mapeamento: ${nomePosto}`);
  return nomeNormalizado;
}

/**
 * Verifica se o nome do posto fornecido corresponde a um posto conhecido
 * 
 * @param nomePosto - Nome do posto a ser verificado
 * @returns - True se o posto for conhecido, false caso contrário
 */
export function isKnownPosto(nomePosto: string | number | null | undefined): boolean {
  if (!nomePosto) return false;
  
  const nomeFormatado = formatPostoName(nomePosto);
  return POSTOS_CONHECIDOS.includes(nomeFormatado);
}

/**
 * Retorna o nome do posto formatado para exibição
 * 
 * @param nomePosto - Nome do posto a ser formatado
 * @returns - Nome do posto formatado para exibição
 */
export function getPostoDisplayName(nomePosto: string | number): string {
  const nomeFormatado = formatPostoName(nomePosto);
  
  // Mapeia nomes formatados para nomes de exibição
  const displayNames: Record<string, string> = {
    'campinas': 'Posto Campinas',
    'campinas_v2': 'Posto Campinas V2',
    'ribeirao': 'Posto Ribeirão Preto',
    'maceio': 'Posto Maceió',
    'caxias': 'Posto Caxias do Sul',
    'contagem': 'Posto Contagem',
    'embu': 'Posto Embu das Artes',
    'limeira': 'Posto Limeira',
    'remedios': 'Posto Remédios',
    'sp': 'Posto São Paulo',
    'barueri': 'Posto Barueri',
    'blumenau': 'Posto Blumenau',
    'alair': 'Posto Alair',
    'alair_v2': 'Posto Alair V2',
    'osasco': 'Posto Osasco',
    'osasco_v2': 'Posto Osasco V2',
    'abc': 'Posto ABC',
    'abc_v2': 'Posto ABC V2',
    'socorro_v2': 'Posto Socorro V2',
    'sorocaba_v2': 'Posto Sorocaba V2'
  };
  
  return displayNames[nomeFormatado] || `Posto ${nomeFormatado.charAt(0).toUpperCase() + nomeFormatado.slice(1)}`;
}

/**
 * Formata o nome da tabela para o padrão utilizado no banco de dados
 * 
 * @param nomePosto - Nome do posto
 * @returns - Nome da tabela no formato "abastecimentos_posto_[nome]"
 */
export function formatarNomeTabela(nomePosto: string): string {
  const nomeFormatado = formatPostoName(nomePosto);
  return `abastecimentos_posto_${nomeFormatado}`;
}

/**
 * Obtém o nome da view consolidada para um posto
 * 
 * @param nomePosto - Nome do posto
 * @returns - Nome da view consolidada
 */
export function obterNomeViewConsolidada(nomePosto: string): string {
  const nomeFormatado = formatPostoName(nomePosto);
  return `view_abastecimentos_${nomeFormatado}_consolidado`;
}

/**
 * Obtém o nome da view de consumo por veículo para um posto
 * 
 * @param nomePosto - Nome do posto
 * @returns - Nome da view de consumo por veículo
 */
export function obterNomeViewConsumoPorVeiculo(nomePosto: string): string {
  const nomeFormatado = formatPostoName(nomePosto);
  return `view_${nomeFormatado}_consumo_por_veiculo`;
}

/**
 * Obtém o nome da view de consumo mensal para um posto
 * 
 * @param nomePosto - Nome do posto
 * @returns - Nome da view de consumo mensal
 */
export function obterNomeViewConsumoMensal(nomePosto: string): string {
  const nomeFormatado = formatPostoName(nomePosto);
  return `view_${nomeFormatado}_consumo_mensal`;
}

/**
 * Obtém o nome da view de comparativo de combustíveis para um posto
 * 
 * @param nomePosto - Nome do posto
 * @returns - Nome da view de comparativo de combustíveis
 */
export function obterNomeViewComparativoCombustiveis(nomePosto: string): string {
  const nomeFormatado = formatPostoName(nomePosto);
  return `view_${nomeFormatado}_comparativo_combustiveis`;
}

/**
 * Obtém o nome da view de últimos abastecimentos para um posto
 * 
 * @param nomePosto - Nome do posto
 * @returns - Nome da view de últimos abastecimentos
 */
export function obterNomeViewUltimosAbastecimentos(nomePosto: string): string {
  const nomeFormatado = formatPostoName(nomePosto);
  return `view_${nomeFormatado}_ultimos_abastecimentos`;
}
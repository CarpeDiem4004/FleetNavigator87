/**
 * Utilitários para padronização de operações relacionadas a postos
 */

/**
 * Lista de postos conhecidos no sistema
 * Esta é a versão padronizada para correspondência com tabelas/views no banco de dados
 */
export const POSTOS_CONHECIDOS = [
  'campinas',
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
  'alair'
];

/**
 * Mapeamento de variações de nome para nome padronizado
 */
export const MAPEAMENTO_POSTOS = {
  // Postos internos
  'campinas': 'campinas',
  'posto campinas': 'campinas',
  'cps': 'campinas',
  
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
  'posto alair': 'alair'
};

/**
 * Formata o nome do posto para o padrão utilizado nas tabelas/views do banco de dados
 * 
 * @param {string} nomePosto - Nome do posto a ser formatado
 * @returns {string} - Nome do posto formatado para uso no banco de dados
 */
export function formatPostoName(nomePosto) {
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
 * @param {string} nomePosto - Nome do posto a ser verificado
 * @returns {boolean} - True se o posto for conhecido, false caso contrário
 */
export function isKnownPosto(nomePosto) {
  if (!nomePosto) return false;
  
  const nomeFormatado = formatPostoName(nomePosto);
  return POSTOS_CONHECIDOS.includes(nomeFormatado);
}

/**
 * Retorna o nome do posto formatado para exibição
 * 
 * @param {string} nomePosto - Nome do posto a ser formatado
 * @returns {string} - Nome do posto formatado para exibição
 */
export function getPostoDisplayName(nomePosto) {
  const nomeFormatado = formatPostoName(nomePosto);
  
  // Mapeia nomes formatados para nomes de exibição
  const displayNames = {
    'campinas': 'Posto Campinas',
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
    'alair': 'Posto Alair'
  };
  
  return displayNames[nomeFormatado] || `Posto ${nomeFormatado.charAt(0).toUpperCase() + nomeFormatado.slice(1)}`;
}
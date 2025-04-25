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
  return nome.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Lista de todos os postos conhecidos no sistema
 */
const POSTOS_CONHECIDOS = [
  'Campinas',
  'Osasco',
  'ABC',
  'Socorro',
  'Sorocaba',
  'SaoPaulo',
  'Ipatinga',
  'BotaFogo',
  'Remedios',
  'VargemGrande',
  'Guarulhos',
  'Alair'
];

/**
 * Verifica se um nome de posto é válido comparando com a lista de postos conhecidos
 * 
 * @param nome Nome do posto para validar
 * @returns boolean indicando se o posto é válido
 */
export function isPostoValido(nome: string): boolean {
  if (!nome) return false;
  const nomeFormatado = formatarNomePosto(nome);
  return POSTOS_CONHECIDOS.some(posto => formatarNomePosto(posto) === nomeFormatado);
}

/**
 * Obtém o nome de exibição formatado para um posto específico
 * 
 * @param nome Nome interno do posto
 * @returns Nome formatado para exibição
 */
export function obterNomeExibicaoPosto(nome: string): string {
  if (!nome) return '';
  
  // Encontrar o nome padrão correspondente na lista
  const postoEncontrado = POSTOS_CONHECIDOS.find(
    posto => formatarNomePosto(posto) === formatarNomePosto(nome)
  );
  
  if (!postoEncontrado) return nome;
  
  // Formatar para exibição com o prefixo "Posto"
  return `Posto ${postoEncontrado}`;
}

/**
 * Formata o nome da tabela para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da tabela formatado
 */
export function formatarNomeTabela(posto: string): string {
  if (!posto) return '';
  return `abastecimentos_posto_${formatarNomePosto(posto)}`;
}

/**
 * Lista todos os postos conhecidos no sistema
 * 
 * @returns Array com os nomes internos de todos os postos
 */
export function listarTodosPosto(): string[] {
  return [...POSTOS_CONHECIDOS];
}

/**
 * Obtém o nome da visualização de consumo por veículo para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da visualização
 */
export function obterNomeViewConsumoPorVeiculo(posto: string): string {
  return `${formatarNomeTabela(posto)}_consumo_por_veiculo`;
}

/**
 * Obtém o nome da visualização de consumo mensal para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da visualização
 */
export function obterNomeViewConsumoMensal(posto: string): string {
  return `${formatarNomeTabela(posto)}_consumo_mensal`;
}

/**
 * Obtém o nome da visualização de comparativo de combustíveis para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da visualização
 */
export function obterNomeViewComparativoCombustiveis(posto: string): string {
  return `${formatarNomeTabela(posto)}_comparativo_combustiveis`;
}

/**
 * Obtém o nome da visualização consolidada para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da visualização
 */
export function obterNomeViewConsolidada(posto: string): string {
  return `${formatarNomeTabela(posto)}_consolidado`;
}

/**
 * Obtém o nome da visualização agregada para relatórios para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da visualização
 */
export function obterNomeViewAgregadaRelatorios(posto: string): string {
  return `${formatarNomeTabela(posto)}_agregado_relatorios`;
}

/**
 * Obtém o nome da visualização de últimos abastecimentos para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da visualização
 */
export function obterNomeViewUltimosAbastecimentos(posto: string): string {
  return `${formatarNomeTabela(posto)}_ultimos_abastecimentos`;
}

/**
 * Obtém o nome da tabela de histórico para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da tabela de histórico
 */
export function obterNomeTabelaHistorico(posto: string): string {
  return `${formatarNomeTabela(posto)}_historico`;
}

/**
 * Obtém o nome da estatísticas mensais para um posto específico
 * 
 * @param posto Nome do posto
 * @returns Nome da visualização de estatísticas
 */
export function obterNomeViewEstatisticasMensais(posto: string): string {
  return `${formatarNomeTabela(posto)}_estatisticas_mensais`;
}
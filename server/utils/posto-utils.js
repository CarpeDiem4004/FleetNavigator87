/**
 * Utilitários para manipulação e formatação de dados de postos no servidor
 */

/**
 * Formata o nome do posto para um formato padronizado
 * Usado para normalizar os nomes de postos entre diferentes partes do sistema
 * 
 * @param {string} nome Nome do posto para formatar
 * @returns {string} Nome formatado
 */
function formatarNomePosto(nome) {
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
  'Guarulhos'
];

/**
 * Verifica se um nome de posto é válido comparando com a lista de postos conhecidos
 * 
 * @param {string} nome Nome do posto para validar
 * @returns {boolean} Indicando se o posto é válido
 */
function isPostoValido(nome) {
  if (!nome) return false;
  const nomeFormatado = formatarNomePosto(nome);
  return POSTOS_CONHECIDOS.some(posto => formatarNomePosto(posto) === nomeFormatado);
}

/**
 * Obtém o nome de exibição formatado para um posto específico
 * 
 * @param {string} nome Nome interno do posto
 * @returns {string} Nome formatado para exibição
 */
function obterNomeExibicaoPosto(nome) {
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
 * @param {string} posto Nome do posto
 * @returns {string} Nome da tabela formatado
 */
function formatarNomeTabela(posto) {
  if (!posto) return '';
  return `abastecimentos_posto_${formatarNomePosto(posto)}`;
}

/**
 * Lista todos os postos conhecidos no sistema
 * 
 * @returns {Array<string>} Array com os nomes internos de todos os postos
 */
function listarTodosPosto() {
  return [...POSTOS_CONHECIDOS];
}

/**
 * Obtém o nome da visualização de consumo por veículo para um posto específico
 * 
 * @param {string} posto Nome do posto
 * @returns {string} Nome da visualização
 */
function obterNomeViewConsumoPorVeiculo(posto) {
  return `${formatarNomeTabela(posto)}_consumo_por_veiculo`;
}

/**
 * Obtém o nome da visualização de consumo mensal para um posto específico
 * 
 * @param {string} posto Nome do posto
 * @returns {string} Nome da visualização
 */
function obterNomeViewConsumoMensal(posto) {
  return `${formatarNomeTabela(posto)}_consumo_mensal`;
}

/**
 * Obtém o nome da visualização de comparativo de combustíveis para um posto específico
 * 
 * @param {string} posto Nome do posto
 * @returns {string} Nome da visualização
 */
function obterNomeViewComparativoCombustiveis(posto) {
  return `${formatarNomeTabela(posto)}_comparativo_combustiveis`;
}

/**
 * Obtém o nome da visualização consolidada para um posto específico
 * 
 * @param {string} posto Nome do posto
 * @returns {string} Nome da visualização
 */
function obterNomeViewConsolidada(posto) {
  return `${formatarNomeTabela(posto)}_consolidado`;
}

/**
 * Obtém o nome da visualização agregada para relatórios para um posto específico
 * 
 * @param {string} posto Nome do posto
 * @returns {string} Nome da visualização
 */
function obterNomeViewAgregadaRelatorios(posto) {
  return `${formatarNomeTabela(posto)}_agregado_relatorios`;
}

/**
 * Obtém o nome da visualização de últimos abastecimentos para um posto específico
 * 
 * @param {string} posto Nome do posto
 * @returns {string} Nome da visualização
 */
function obterNomeViewUltimosAbastecimentos(posto) {
  return `${formatarNomeTabela(posto)}_ultimos_abastecimentos`;
}

/**
 * Obtém o nome da tabela de histórico para um posto específico
 * 
 * @param {string} posto Nome do posto
 * @returns {string} Nome da tabela de histórico
 */
function obterNomeTabelaHistorico(posto) {
  return `${formatarNomeTabela(posto)}_historico`;
}

/**
 * Obtém o nome da estatísticas mensais para um posto específico
 * 
 * @param {string} posto Nome do posto
 * @returns {string} Nome da visualização de estatísticas
 */
function obterNomeViewEstatisticasMensais(posto) {
  return `${formatarNomeTabela(posto)}_estatisticas_mensais`;
}

module.exports = {
  formatarNomePosto,
  isPostoValido,
  obterNomeExibicaoPosto,
  formatarNomeTabela,
  listarTodosPosto,
  obterNomeViewConsumoPorVeiculo,
  obterNomeViewConsumoMensal,
  obterNomeViewComparativoCombustiveis,
  obterNomeViewConsolidada,
  obterNomeViewAgregadaRelatorios,
  obterNomeViewUltimosAbastecimentos,
  obterNomeTabelaHistorico,
  obterNomeViewEstatisticasMensais
};
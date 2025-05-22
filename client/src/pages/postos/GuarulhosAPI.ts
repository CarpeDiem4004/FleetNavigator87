/**
 * API específica para o posto Guarulhos V2
 * Esta API resolve problemas específicos do posto Guarulhos_v2
 */

import axios from 'axios';

/**
 * Insere um registro de abastecimento na tabela Guarulhos V2
 * Ignora a rota padrão que está causando o erro
 */
export async function inserirAbastecimentoGuarulhosV2(dados: any) {
  try {
    // Certifique-se de que todos os campos necessários estejam presentes
    const dadosNormalizados = {
      placa: dados.placa,
      km_atual: dados.km || dados.km_atual || 0,
      tipo_combustivel: dados.tipo || dados.tipo_combustivel || 'Diesel',
      litros: dados.quantidade || dados.quantidade_litros || dados.litros || 0,
      valor_litro: dados.valor_litro || dados.preco_litro || 0,
      valor_total: dados.valor_total || 0,
      project: dados.projeto || dados.project || '', // Salvar o projeto como project para GuarulhosV2
      tipo_veiculo: dados.tipo_veiculo || 'frota',
      observacoes: dados.observacoes || null
    };
    
    // Executar a inserção SQL direta para evitar o problema com comentários no código
    const response = await axios.post('/api/sql-seguro', {
      query: `
        INSERT INTO abastecimentos_posto_guarulhos_v2 
        (placa, km_atual, tipo_combustivel, litros, valor_litro, valor_total, project, tipo_veiculo, observacoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      params: [
        dadosNormalizados.placa,
        dadosNormalizados.km_atual,
        dadosNormalizados.tipo_combustivel,
        dadosNormalizados.litros,
        dadosNormalizados.valor_litro,
        dadosNormalizados.valor_total,
        dadosNormalizados.project,
        dadosNormalizados.tipo_veiculo,
        dadosNormalizados.observacoes
      ]
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao inserir abastecimento GuarulhosV2:', error);
    throw error;
  }
}
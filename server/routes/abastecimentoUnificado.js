/**
 * Rota unificada para registro de abastecimento
 * Usa o mapeador de schema para garantir compatibilidade com todos os postos
 */

import { Router } from 'express';
import { pool } from '../db.js';
import { 
  mapearDadosParaPosto, 
  obterNomeTabela, 
  obterCamposMapeadosParaLeitura,
  isPostoSuportado 
} from '../utils/postoSchemaMapper.js';

const router = Router();

/**
 * Valida os dados de entrada do abastecimento
 */
function validarDadosAbastecimento(dados) {
  const erros = [];
  
  // Validações obrigatórias
  if (!dados.placa || typeof dados.placa !== 'string' || dados.placa.trim().length === 0) {
    erros.push('Placa é obrigatória e deve ser um texto válido');
  }
  
  if (!dados.quantidade || isNaN(Number(dados.quantidade)) || Number(dados.quantidade) <= 0) {
    erros.push('Quantidade de litros é obrigatória e deve ser um número positivo');
  }
  
  if (!dados.km || isNaN(Number(dados.km)) || Number(dados.km) < 0) {
    erros.push('Quilometragem é obrigatória e deve ser um número não negativo');
  }
  
  if (!dados.tipo_combustivel || !['Diesel', 'Arla', 'diesel', 'arla'].includes(dados.tipo_combustivel)) {
    erros.push('Tipo de combustível deve ser Diesel ou Arla');
  }
  
  if (!dados.motorista || typeof dados.motorista !== 'string' || dados.motorista.trim().length === 0) {
    erros.push('Nome do motorista é obrigatório');
  }
  
  if (!dados.operador || typeof dados.operador !== 'string' || dados.operador.trim().length === 0) {
    erros.push('Nome do operador é obrigatório');
  }
  
  if (!dados.valor_litro || isNaN(Number(dados.valor_litro)) || Number(dados.valor_litro) <= 0) {
    erros.push('Valor por litro é obrigatório e deve ser um número positivo');
  }
  
  // Validar valor total se fornecido, caso contrário calcular
  const valorCalculado = Number(dados.quantidade) * Number(dados.valor_litro);
  if (dados.valor_total && isNaN(Number(dados.valor_total))) {
    erros.push('Valor total deve ser um número válido');
  }
  
  return {
    valido: erros.length === 0,
    erros,
    valorCalculado
  };
}

/**
 * Atualiza o nível do tanque após o abastecimento
 */
async function atualizarNivelTanque(posto, tipoCombustivel, quantidadeLitros) {
  try {
    console.log(`Atualizando nível do tanque ${tipoCombustivel} para posto ${posto}`);
    
    // Buscar configuração atual do tanque
    const configQuery = `
      SELECT 
        diesel_nivel, diesel_capacidade,
        arla_nivel, arla_capacidade
      FROM configuracao_tanques 
      WHERE posto = $1
    `;
    
    const configResult = await pool.query(configQuery, [posto]);
    
    if (configResult.rows.length === 0) {
      console.warn(`Configuração de tanque não encontrada para posto: ${posto}`);
      return;
    }
    
    const config = configResult.rows[0];
    const quantidade = Number(quantidadeLitros);
    
    // Determinar qual tanque atualizar
    let campoNivel, nivelAtual;
    
    if (tipoCombustivel.toLowerCase() === 'diesel') {
      campoNivel = 'diesel_nivel';
      nivelAtual = Number(config.diesel_nivel) || 0;
    } else if (tipoCombustivel.toLowerCase() === 'arla') {
      campoNivel = 'arla_nivel';
      nivelAtual = Number(config.arla_nivel) || 0;
    } else {
      console.warn(`Tipo de combustível desconhecido: ${tipoCombustivel}`);
      return;
    }
    
    // Calcular novo nível (subtraindo o que foi abastecido)
    const novoNivel = Math.max(0, nivelAtual - quantidade);
    
    // Atualizar no banco
    const updateQuery = `
      UPDATE configuracao_tanques 
      SET ${campoNivel} = $1, updated_at = NOW()
      WHERE posto = $2
    `;
    
    await pool.query(updateQuery, [novoNivel, posto]);
    
    console.log(`Nível do tanque ${tipoCombustivel} atualizado: ${nivelAtual} -> ${novoNivel} litros`);
    
  } catch (error) {
    console.error('Erro ao atualizar nível do tanque:', error);
    // Não interrompe o processo, apenas registra o erro
  }
}

/**
 * POST /api/abastecimento/:posto
 * Registra um novo abastecimento usando mapeamento automático de schema
 */
router.post('/:posto', async (req, res) => {
  try {
    const { posto } = req.params;
    const dadosEntrada = req.body;
    
    console.log(`[AbastecimentoUnificado] Processando registro para posto: ${posto}`);
    console.log(`[AbastecimentoUnificado] Dados recebidos:`, dadosEntrada);
    
    // Verificar se o posto é suportado
    if (!isPostoSuportado(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto não suportado: ${posto}. Verifique o nome do posto.`
      });
    }
    
    // Validar dados de entrada
    const validacao = validarDadosAbastecimento(dadosEntrada);
    if (!validacao.valido) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        erros: validacao.erros
      });
    }
    
    // Preparar dados com valores calculados
    const dadosCompletos = {
      ...dadosEntrada,
      placa: dadosEntrada.placa.toUpperCase().trim(),
      quantidade: Number(dadosEntrada.quantidade),
      km: Number(dadosEntrada.km),
      valor_litro: Number(dadosEntrada.valor_litro),
      valor_total: dadosEntrada.valor_total ? Number(dadosEntrada.valor_total) : validacao.valorCalculado,
      tipo_combustivel: dadosEntrada.tipo_combustivel,
      tipo_veiculo: dadosEntrada.tipo_veiculo || 'frota',
      projeto: dadosEntrada.projeto || 'Não definido'
    };
    
    // Mapear dados para o schema específico do posto
    const dadosMapeados = mapearDadosParaPosto(posto, dadosCompletos);
    const nomeTabela = obterNomeTabela(posto);
    
    console.log(`[AbastecimentoUnificado] Inserindo na tabela: ${nomeTabela}`);
    console.log(`[AbastecimentoUnificado] Dados mapeados:`, dadosMapeados);
    
    // Construir query de inserção dinamicamente
    const campos = Object.keys(dadosMapeados);
    const placeholders = campos.map((_, index) => `$${index + 1}`);
    const valores = campos.map(campo => dadosMapeados[campo]);
    
    const insertQuery = `
      INSERT INTO ${nomeTabela} (${campos.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING id
    `;
    
    // Executar inserção
    const result = await pool.query(insertQuery, valores);
    
    if (result.rows.length > 0) {
      const novoId = result.rows[0].id;
      
      console.log(`[AbastecimentoUnificado] Abastecimento registrado com sucesso. ID: ${novoId}`);
      
      // Atualizar nível do tanque
      await atualizarNivelTanque(posto, dadosCompletos.tipo_combustivel, dadosCompletos.quantidade);
      
      return res.status(201).json({
        success: true,
        id: novoId,
        message: 'Abastecimento registrado com sucesso',
        dados: {
          posto,
          placa: dadosCompletos.placa,
          quantidade: dadosCompletos.quantidade,
          tipo_combustivel: dadosCompletos.tipo_combustivel,
          valor_total: dadosCompletos.valor_total
        }
      });
    } else {
      throw new Error('Nenhum ID retornado após inserção');
    }
    
  } catch (error) {
    console.error(`[AbastecimentoUnificado] Erro ao registrar abastecimento:`, error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao registrar abastecimento',
      error: error.message
    });
  }
});

/**
 * GET /api/abastecimento/:posto/historico
 * Obtém histórico de abastecimentos usando mapeamento automático de schema
 */
router.get('/:posto/historico', async (req, res) => {
  try {
    const { posto } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    console.log(`[AbastecimentoUnificado] Buscando histórico para posto: ${posto}`);
    
    // Verificar se o posto é suportado
    if (!isPostoSuportado(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto não suportado: ${posto}`
      });
    }
    
    const nomeTabela = obterNomeTabela(posto);
    const camposMapeados = obterCamposMapeadosParaLeitura(posto);
    
    // Verificar se a tabela existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `;
    
    const tableCheck = await pool.query(tableExistsQuery, [nomeTabela]);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        success: true,
        message: `Tabela ${nomeTabela} ainda não existe`,
        data: [],
        count: 0
      });
    }
    
    // Buscar histórico
    const historyQuery = `
      SELECT ${camposMapeados}
      FROM ${nomeTabela}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(historyQuery, [Number(limit), Number(offset)]);
    
    // Buscar total de registros
    const countQuery = `SELECT COUNT(*) as total FROM ${nomeTabela}`;
    const countResult = await pool.query(countQuery);
    const total = countResult.rows[0].total;
    
    console.log(`[AbastecimentoUnificado] Histórico obtido: ${result.rows.length} registros`);
    
    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total: Number(total),
      posto
    });
    
  } catch (error) {
    console.error(`[AbastecimentoUnificado] Erro ao buscar histórico:`, error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message
    });
  }
});

export default router;
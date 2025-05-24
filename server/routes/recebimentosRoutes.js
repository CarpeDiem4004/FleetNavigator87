/**
 * Rotas unificadas para gerenciamento de recebimentos de combustível
 */
import express from 'express';
const router = express.Router();
import { pool } from '../db.js';
import { checkAuthAndRoles } from '../utils/auth-utils.js';
import { getRecebimentosOsascoV2, registrarRecebimentoOsascoV2 } from './recebimentosOsascoHandler.js';

/**
 * Atualiza o nível do tanque de combustível após um recebimento
 * @param {string} posto - Nome do posto
 * @param {Object} recebimentoData - Dados do recebimento
 */
async function atualizarNivelTanque(posto, recebimentoData) {
  try {
    // Verificar se a tabela configuracao_tanques existe
    const checkConfigQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'configuracao_tanques'
      ) as "exists";
    `;
    
    const configTableCheck = await pool.query(checkConfigQuery);
    
    if (configTableCheck.rows[0].exists) {
      // Buscar configuração atual
      const getConfigQuery = `
        SELECT * FROM configuracao_tanques 
        WHERE posto = $1
      `;
      
      const configResult = await pool.query(getConfigQuery, [posto]);
      
      if (configResult.rowCount > 0) {
        const config = configResult.rows[0];
        const tipoCombustivel = recebimentoData.tipo_combustivel.toLowerCase();
        
        // Atualizar nível e consumo total baseado no tipo de combustível
        if (tipoCombustivel.includes('diesel')) {
          // Atualizar nível de diesel
          const nivelAtual = parseFloat(config.diesel_nivel || 0);
          const novoNivel = nivelAtual + parseFloat(recebimentoData.quantidade_litros);
          
          const updateQuery = `
            UPDATE configuracao_tanques
            SET diesel_nivel = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `;
          
          await pool.query(updateQuery, [novoNivel, config.id]);
          console.log(`[Recebimentos] Atualizado nível de diesel para: ${novoNivel}`);
        } else if (tipoCombustivel.includes('arla')) {
          // Atualizar nível de Arla
          const nivelAtual = parseFloat(config.arla_nivel || 0);
          const novoNivel = nivelAtual + parseFloat(recebimentoData.quantidade_litros);
          
          const updateQuery = `
            UPDATE configuracao_tanques
            SET arla_nivel = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `;
          
          await pool.query(updateQuery, [novoNivel, config.id]);
          console.log(`[Recebimentos] Atualizado nível de Arla para: ${novoNivel}`);
        }
      }
    }
  } catch (error) {
    console.error('[Recebimentos] Erro ao atualizar nível do tanque:', error);
    throw error;
  }
}

/**
 * GET /api/recebimentos/:posto
 * Obtém histórico de recebimentos de um posto específico
 */
router.get('/:posto', async (req, res) => {
  try {
    const { posto } = req.params;
    // Removendo limite para permitir recuperar todos os registros
    // const limit = parseInt(req.query.limit) || 50;
    const limit = 999999; // Valor alto para trazer praticamente todos os registros
    
    console.log(`[Recebimentos] Buscando recebimentos para posto: ${posto}`);
    
    // Caso especial: usar manipulador específico para Osasco_v2
    if (posto.toLowerCase() === 'osasco_v2') {
      console.log(`[Recebimentos] Tratando requisição de recebimentos para Osasco V2 diretamente`);
      try {
        const result = await getRecebimentosOsascoV2(limit);
        console.log(`[Recebimentos] Dados obtidos para Osasco: ${result.data?.length || 0} registros`);
        return res.json(result);
      } catch (error) {
        console.error('[Recebimentos] Erro ao processar recebimentos do Osasco:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao processar recebimentos do posto Osasco',
          error: error.message
        });
      }
    }
    
    // Para outros postos, usar fluxo padrão
    // Obter nome da tabela de recebimentos para o posto
    const nomeTabela = `recebimentos_posto_${posto.toLowerCase()}`;
    
    // Verificar se a tabela existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const tableCheck = await pool.query(checkTableQuery, [nomeTabela]);
    
    if (!tableCheck.rows[0].exists) {
      console.log(`[Recebimentos] Tabela ${nomeTabela} não existe, criando...`);
      
      // Criar tabela se não existir
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${nomeTabela} (
          id SERIAL PRIMARY KEY,
          fornecedor VARCHAR(255) NOT NULL,
          tipo_combustivel VARCHAR(50) NOT NULL,
          quantidade_litros NUMERIC(10, 2) NOT NULL,
          valor_litro NUMERIC(10, 3) NOT NULL,
          valor_total NUMERIC(10, 2) NOT NULL,
          numero_nota VARCHAR(50),
          operador VARCHAR(255) NOT NULL,
          data_entrega DATE,
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await pool.query(createTableQuery);
      
      // Retornar lista vazia, pois a tabela acabou de ser criada
      return res.json({
        success: true,
        message: `Tabela ${nomeTabela} criada com sucesso, sem recebimentos ainda`,
        data: [],
        count: 0
      });
    }
    
    // Consulta padrão para outros postos
    const query = `
      SELECT *
      FROM ${nomeTabela}
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    console.log(`[Recebimentos] Encontrados ${result.rowCount} recebimentos para o posto ${posto}`);
    
    return res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
    
  } catch (error) {
    console.error(`[Recebimentos] Erro ao buscar recebimentos:`, error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos',
      error: error.message
    });
  }
});

/**
 * POST /api/recebimentos/:posto
 * Registra um novo recebimento de combustível para um posto
 */
router.post('/:posto', async (req, res) => {
  try {
    const { posto } = req.params;
    const recebimentoData = req.body;
    
    console.log(`[Recebimentos] Registrando recebimento para posto ${posto}:`, recebimentoData);
    
    // Validação básica
    if (!recebimentoData.fornecedor || !recebimentoData.tipo_combustivel || 
        !recebimentoData.quantidade_litros || !recebimentoData.valor_litro) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos para registro de recebimento'
      });
    }
    
    // Caso especial para Osasco_v2 que tem estrutura diferente
    if (posto.toLowerCase() === 'osasco_v2') {
      console.log(`[Recebimentos] Utilizando manipulador específico para Osasco_v2`);
      const result = await registrarRecebimentoOsascoV2(recebimentoData);
      
      // Se o registro foi bem-sucedido, também atualizar nível do tanque
      if (result.success) {
        try {
          await atualizarNivelTanque(posto, recebimentoData);
        } catch (configError) {
          console.error('[Recebimentos] Erro ao atualizar configuração de tanques:', configError);
          // Não interromper o fluxo principal se houver erro na atualização da configuração
        }
      }
      
      return res.status(result.success ? 201 : 500).json(result);
    }
    
    // Para postos padrão, prosseguir com o fluxo normal
    // Obter nome da tabela de recebimentos para o posto
    const nomeTabela = `recebimentos_posto_${posto.toLowerCase()}`;
    
    // Verificar se a tabela existe, e criar se não existir
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const tableCheck = await pool.query(checkTableQuery, [nomeTabela]);
    
    // Para outros postos, usar estrutura padrão
    if (!tableCheck.rows[0].exists) {
      console.log(`[Recebimentos] Tabela ${nomeTabela} não existe, criando...`);
      
      // Criar tabela se não existir (padrão)
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${nomeTabela} (
          id SERIAL PRIMARY KEY,
          fornecedor VARCHAR(255) NOT NULL,
          tipo_combustivel VARCHAR(50) NOT NULL,
          quantidade_litros NUMERIC(10, 2) NOT NULL,
          valor_litro NUMERIC(10, 3) NOT NULL,
          valor_total NUMERIC(10, 2) NOT NULL,
          numero_nota VARCHAR(50),
          operador VARCHAR(255) NOT NULL,
          data_entrega DATE,
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await pool.query(createTableQuery);
    }
    
    // Preparar consulta SQL para inserir recebimento (padrão)
    const insertQuery = `
      INSERT INTO ${nomeTabela} (
        fornecedor,
        tipo_combustivel,
        quantidade_litros,
        valor_litro,
        valor_total,
        numero_nota,
        operador,
        data_entrega,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    
    const values = [
      recebimentoData.fornecedor,
      recebimentoData.tipo_combustivel,
      recebimentoData.quantidade_litros,
      recebimentoData.valor_litro,
      recebimentoData.valor_total,
      recebimentoData.numero_nota || '',
      recebimentoData.operador,
      recebimentoData.data_entrega || new Date(),
      recebimentoData.observacoes || ''
    ];
    
    const result = await pool.query(insertQuery, values);
    
    // Atualizar configuração de tanques
    try {
      // Verificar se a tabela configuracao_tanques existe
      const checkConfigQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'configuracao_tanques'
        ) as "exists";
      `;
      
      const configTableCheck = await pool.query(checkConfigQuery);
      
      if (configTableCheck.rows[0].exists) {
        // Buscar configuração atual
        const getConfigQuery = `
          SELECT * FROM configuracao_tanques 
          WHERE posto = $1
        `;
        
        const configResult = await pool.query(getConfigQuery, [posto]);
        
        if (configResult.rowCount > 0) {
          const config = configResult.rows[0];
          const tipoCombustivel = recebimentoData.tipo_combustivel.toLowerCase();
          
          // Atualizar nível e consumo total baseado no tipo de combustível
          if (tipoCombustivel.includes('diesel')) {
            // Atualizar nível de diesel
            const nivelAtual = parseFloat(config.diesel_nivel || 0);
            const novoNivel = nivelAtual + parseFloat(recebimentoData.quantidade_litros);
            
            const updateQuery = `
              UPDATE configuracao_tanques
              SET diesel_nivel = $1,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `;
            
            await pool.query(updateQuery, [novoNivel, config.id]);
            console.log(`[Recebimentos] Atualizado nível de diesel para: ${novoNivel}`);
          } else if (tipoCombustivel.includes('arla')) {
            // Atualizar nível de Arla
            const nivelAtual = parseFloat(config.arla_nivel || 0);
            const novoNivel = nivelAtual + parseFloat(recebimentoData.quantidade_litros);
            
            const updateQuery = `
              UPDATE configuracao_tanques
              SET arla_nivel = $1,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `;
            
            await pool.query(updateQuery, [novoNivel, config.id]);
            console.log(`[Recebimentos] Atualizado nível de Arla para: ${novoNivel}`);
          }
        }
      }
    } catch (configError) {
      console.error('[Recebimentos] Erro ao atualizar configuração de tanques:', configError);
      // Não interromper o fluxo principal se houver erro na atualização da configuração
    }
    
    res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`[Recebimentos] Erro ao registrar recebimento:`, error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento',
      error: error.message
    });
  }
});

export default router;
/**
 * Rotas unificadas para gerenciamento de recebimentos de combustível
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { checkAuthAndRoles } = require('../utils/auth-utils');

/**
 * GET /api/recebimentos/:posto
 * Obtém histórico de recebimentos de um posto específico
 */
router.get('/:posto', async (req, res) => {
  try {
    const { posto } = req.params;
    const { limit = 50 } = req.query;
    
    console.log(`[Recebimentos] Buscando recebimentos para posto: ${posto}`);
    
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
    
    // Consultar dados da tabela
    let query;
    
    // Tratamento especial para o posto Osasco V2 que usa nomenclatura diferente
    if (posto.toLowerCase() === 'osasco_v2') {
      console.log(`[Recebimentos] Tratando requisição de recebimentos para Osasco V2 com mapeamento de colunas`);
      query = `
        SELECT 
          id,
          nome_fornecedor as fornecedor,
          tipo_produto as tipo_combustivel,
          litros_recebidos as quantidade_litros,
          COALESCE(valor_litro, valor_total / NULLIF(litros_recebidos, 0)) as valor_litro,
          valor_total,
          COALESCE(numero_nota, '') as numero_nota,
          nome_operador as operador,
          COALESCE(data_entrega, created_at::date) as data_entrega,
          observacoes,
          created_at
        FROM ${nomeTabela}
        ORDER BY created_at DESC
        LIMIT $1
      `;
    } else {
      query = `
        SELECT *
        FROM ${nomeTabela}
        ORDER BY created_at DESC
        LIMIT $1
      `;
    }
    
    const result = await pool.query(query, [limit]);
    
    res.json({
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
    
    // Caso especial para Osasco_v2 que tem estrutura diferente
    if (posto.toLowerCase() === 'osasco_v2') {
      console.log(`[Recebimentos] Utilizando estrutura específica para Osasco_v2`);
      
      if (!tableCheck.rows[0].exists) {
        // Criar tabela usando a estrutura específica do Osasco_v2
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS ${nomeTabela} (
            id SERIAL PRIMARY KEY,
            nome_fornecedor VARCHAR(255) NOT NULL,
            tipo_produto VARCHAR(50) NOT NULL,
            litros_recebidos NUMERIC(10, 2) NOT NULL,
            valor_litro NUMERIC(10, 3),
            valor_total NUMERIC(10, 2) NOT NULL,
            numero_nota VARCHAR(50),
            nome_operador VARCHAR(255) NOT NULL,
            data_entrega DATE,
            observacoes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        
        await pool.query(createTableQuery);
      }
      
      // Inserir usando colunas específicas do Osasco_v2
      const insertQuery = `
        INSERT INTO ${nomeTabela} (
          nome_fornecedor,
          tipo_produto,
          litros_recebidos,
          valor_litro,
          valor_total,
          numero_nota,
          nome_operador,
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
      
      // Retornar após o processamento específico para Osasco_v2
      res.status(201).json({
        success: true,
        message: 'Recebimento registrado com sucesso',
        data: result.rows[0]
      });
      
      // Atualizar configuração de tanques (código comum fora deste bloco)
      return;
    }
    
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

module.exports = router;
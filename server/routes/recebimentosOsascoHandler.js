/**
 * Manipulador especializado para recebimentos do posto Osasco V2
 * 
 * Este manipulador trata da estrutura de tabela específica do posto Osasco,
 * que usa nomenclatura diferente para as colunas:
 * - nome_fornecedor em vez de fornecedor
 * - tipo_produto em vez de tipo_combustivel
 * - litros_recebidos em vez de quantidade_litros
 */
const { pool } = require('../db');

/**
 * Obtém os recebimentos do posto Osasco V2
 * @param {number} limit - Limite de registros a retornar
 * @returns {Object} Objeto com status da operação e dados
 */
async function getRecebimentosOsascoV2(limit = 50) {
  try {
    const nomeTabela = 'recebimentos_posto_osasco_v2';
    
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `, [nomeTabela]);
    
    if (!tableExists.rows[0].exists) {
      return {
        success: true,
        message: `Tabela ${nomeTabela} não existe, sem dados de recebimentos.`,
        data: [],
        count: 0
      };
    }
    
    // Consulta especializada que mapeia as colunas específicas de Osasco V2
    // para o formato padronizado esperado pelo frontend
    const query = `
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
    
    const result = await pool.query(query, [limit]);
    
    console.log(`[RecebimentosOsasco] Encontrados ${result.rowCount} recebimentos para o posto Osasco V2`);
    
    return {
      success: true,
      data: result.rows,
      count: result.rowCount
    };
  } catch (error) {
    console.error(`[RecebimentosOsasco] Erro ao buscar recebimentos:`, error);
    
    return {
      success: false,
      message: 'Erro ao buscar recebimentos do posto Osasco V2',
      error: error.message
    };
  }
}

/**
 * Registra um novo recebimento para o posto Osasco V2
 * @param {Object} recebimentoData - Dados do recebimento no formato padrão
 * @returns {Object} Objeto com status da operação e dados
 */
async function registrarRecebimentoOsascoV2(recebimentoData) {
  try {
    const nomeTabela = 'recebimentos_posto_osasco_v2';
    
    // Verificar se a tabela existe e criar se não existir
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const tableCheck = await pool.query(checkTableQuery, [nomeTabela]);
    
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
      console.log(`[RecebimentosOsasco] Tabela ${nomeTabela} criada com sucesso`);
    }
    
    // Inserir dados usando colunas específicas do Osasco_v2
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
    
    const valores = [
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
    
    console.log(`[RecebimentosOsasco] Inserindo recebimento para Osasco V2:`, {
      fornecedor: recebimentoData.fornecedor,
      tipo: recebimentoData.tipo_combustivel,
      litros: recebimentoData.quantidade_litros,
      valor: recebimentoData.valor_total
    });
    
    const result = await pool.query(insertQuery, valores);
    
    // Mapear o resultado de volta para o formato padrão para o frontend
    const dadoInserido = {
      id: result.rows[0].id,
      fornecedor: result.rows[0].nome_fornecedor,
      tipo_combustivel: result.rows[0].tipo_produto,
      quantidade_litros: result.rows[0].litros_recebidos,
      valor_litro: result.rows[0].valor_litro,
      valor_total: result.rows[0].valor_total,
      numero_nota: result.rows[0].numero_nota,
      operador: result.rows[0].nome_operador,
      data_entrega: result.rows[0].data_entrega,
      observacoes: result.rows[0].observacoes,
      created_at: result.rows[0].created_at
    };
    
    return {
      success: true,
      message: 'Recebimento registrado com sucesso para Osasco V2',
      data: dadoInserido
    };
  } catch (error) {
    console.error(`[RecebimentosOsasco] Erro ao registrar recebimento:`, error);
    
    return {
      success: false,
      message: 'Erro ao registrar recebimento para o posto Osasco V2',
      error: error.message
    };
  }
}

module.exports = {
  getRecebimentosOsascoV2,
  registrarRecebimentoOsascoV2
};
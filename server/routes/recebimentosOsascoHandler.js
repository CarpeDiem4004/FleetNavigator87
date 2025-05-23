/**
 * Manipulador específico para recebimentos do posto Osasco V2
 * que possui uma estrutura de tabela diferente dos outros postos
 */
const { pool } = require('../db-config');

/**
 * Busca recebimentos do posto Osasco V2 adaptando o formato de dados
 * @param {number} limit - Limite de registros a serem retornados
 * @returns {Promise<Array>} - Array de recebimentos formatados
 */
async function getRecebimentosOsascoV2(limit = 50) {
  try {
    const tableExists = await checkTableExists('recebimentos_posto_osasco_v2');
    
    if (!tableExists) {
      console.log('[RecebimentosOsasco] Tabela recebimentos_posto_osasco_v2 não existe');
      return { success: true, data: [], count: 0 };
    }
    
    // Consulta adaptada específica para Osasco V2
    const query = `
      SELECT 
        id,
        nome_fornecedor as fornecedor,
        tipo_produto as tipo_combustivel,
        litros_recebidos as quantidade_litros,
        COALESCE(valor_total / NULLIF(litros_recebidos, 0), 0) as valor_litro,
        valor_total,
        COALESCE(nome_operador, '') as operador,
        observacoes,
        created_at,
        updated_at
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    console.log(`[RecebimentosOsasco] Encontrados ${result.rowCount} recebimentos`);
    
    return {
      success: true,
      data: result.rows,
      count: result.rowCount
    };
  } catch (error) {
    console.error('[RecebimentosOsasco] Erro:', error);
    return {
      success: false,
      message: 'Erro ao buscar recebimentos do posto Osasco V2',
      error: error.message
    };
  }
}

/**
 * Registra um novo recebimento para o posto Osasco V2
 * @param {Object} recebimentoData - Dados do recebimento
 * @returns {Promise<Object>} - Resultado da operação
 */
async function registrarRecebimentoOsascoV2(recebimentoData) {
  try {
    const tableExists = await checkTableExists('recebimentos_posto_osasco_v2');
    
    if (!tableExists) {
      // Criar tabela se não existir com a estrutura específica de Osasco_v2
      await createOsascoV2RecebimentosTable();
    }
    
    // Adaptar dados do formato padrão para o formato específico de Osasco_v2
    const osascoData = {
      nome_fornecedor: recebimentoData.fornecedor,
      tipo_produto: recebimentoData.tipo_combustivel,
      litros_recebidos: recebimentoData.quantidade_litros,
      valor_total: recebimentoData.valor_total,
      nome_operador: recebimentoData.operador,
      observacoes: recebimentoData.observacoes || ''
    };
    
    // Realizar inserção no formato da tabela de Osasco_v2
    const query = `
      INSERT INTO recebimentos_posto_osasco_v2 (
        nome_fornecedor,
        tipo_produto,
        litros_recebidos,
        valor_total,
        nome_operador,
        observacoes,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *;
    `;
    
    const values = [
      osascoData.nome_fornecedor,
      osascoData.tipo_produto,
      osascoData.litros_recebidos,
      osascoData.valor_total,
      osascoData.nome_operador,
      osascoData.observacoes
    ];
    
    const result = await pool.query(query, values);
    console.log('[RecebimentosOsasco] Recebimento registrado com sucesso');
    
    return {
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: result.rows[0]
    };
  } catch (error) {
    console.error('[RecebimentosOsasco] Erro ao registrar recebimento:', error);
    return {
      success: false,
      message: 'Erro ao registrar recebimento para o posto Osasco V2',
      error: error.message
    };
  }
}

/**
 * Verifica se uma tabela existe no banco de dados
 * @param {string} tableName - Nome da tabela a verificar
 * @returns {Promise<boolean>} - Verdadeiro se a tabela existir
 */
async function checkTableExists(tableName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    ) as "exists";
  `;
  
  const result = await pool.query(query, [tableName]);
  return result.rows[0].exists;
}

/**
 * Cria a tabela de recebimentos para o posto Osasco V2
 * @returns {Promise<void>}
 */
async function createOsascoV2RecebimentosTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
      id SERIAL PRIMARY KEY,
      nome_fornecedor VARCHAR(255) NOT NULL,
      tipo_produto VARCHAR(50) NOT NULL,
      litros_recebidos NUMERIC(10, 2) NOT NULL,
      valor_total NUMERIC(10, 2) NOT NULL,
      nome_operador VARCHAR(255) NOT NULL,
      observacoes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await pool.query(query);
  console.log('[RecebimentosOsasco] Tabela recebimentos_posto_osasco_v2 criada com sucesso');
}

module.exports = {
  getRecebimentosOsascoV2,
  registrarRecebimentoOsascoV2
};
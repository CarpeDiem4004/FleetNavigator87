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
    // Consulta direta para verificar se existem registros e obter os dados
    const query = `
      SELECT COUNT(*) FROM recebimentos_posto_osasco_v2
    `;
    
    const countResult = await pool.query(query);
    const count = parseInt(countResult.rows[0].count);
    
    console.log(`[RecebimentosOsasco] Contagem de registros em recebimentos_posto_osasco_v2: ${count}`);
    
    if (count === 0) {
      console.log(`[RecebimentosOsasco] Nenhum registro encontrado na tabela.`);
      return {
        success: true,
        data: [],
      };
    }
    
    // Se existirem registros, buscar os dados
    const selectQuery = `
      SELECT * FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(selectQuery, [limit]);
    console.log(`[RecebimentosOsasco] Registros obtidos: ${result.rowCount}`);
    
    // Criar array de dados manualmente
    const recebimentosData = [];
    
    for (const row of result.rows) {
      // Calcular valor por litro se não existir
      let valorLitro = 0;
      if (row.valor_litro) {
        valorLitro = parseFloat(row.valor_litro);
      } else if (parseFloat(row.litros_recebidos) > 0) {
        valorLitro = parseFloat(row.valor_total) / parseFloat(row.litros_recebidos);
      }
      
      recebimentosData.push({
        id: row.id,
        fornecedor: row.nome_fornecedor,
        tipo_combustivel: row.tipo_produto,
        quantidade_litros: parseFloat(row.litros_recebidos),
        valor_litro: valorLitro,
        valor_total: parseFloat(row.valor_total),
        numero_nota: '(Não informado)',
        operador: row.nome_operador,
        data_entrega: new Date().toISOString().split('T')[0], // Usar data atual como fallback
        observacoes: row.observacoes || '',
        created_at: new Date(row.created_at).toISOString()
      });
    }
    
    console.log(`[RecebimentosOsasco] Dados mapeados: ${recebimentosData.length} registros`);
    
    // Retornar os dados formatados
    return {
      success: true,
      data: recebimentosData
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
/**
 * Rota direta para os recebimentos do posto Osasco V2
 * Esta implementação acessa diretamente a tabela recebimentos_posto_osasco_v2
 */

const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Rota para obter todos os recebimentos
router.get('/api/osasco-v2/recebimentos', async (req, res) => {
  try {
    console.log('[OsascoV2Direto] Buscando recebimentos...');
    
    // Verificar se a tabela existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `;
    
    const tableExistsResult = await pool.query(checkTableQuery);
    
    if (!tableExistsResult.rows[0].exists) {
      console.log('[OsascoV2Direto] Tabela de recebimentos não encontrada');
      return res.json({
        success: false,
        message: 'Tabela de recebimentos não encontrada',
        data: []
      });
    }
    
    // Buscar recebimentos
    const query = `
      SELECT * FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC;
    `;
    
    const result = await pool.query(query);
    console.log(`[OsascoV2Direto] Encontrados ${result.rowCount} recebimentos`);
    
    // Mapear os resultados para o formato esperado pela interface
    const mappedData = result.rows.map(row => ({
      id: row.id,
      fornecedor: row.nome_fornecedor,
      tipo_combustivel: row.tipo_produto,
      quantidade_litros: row.litros_recebidos,
      valor_litro: row.valor_litro,
      valor_total: row.valor_total,
      numero_nota: row.numero_nota,
      data_entrega: row.data_entrega,
      nome_operador: row.nome_operador,
      operador: row.nome_operador, // Duplicado para compatibilidade
      observacoes: row.observacoes,
      data_formatada: new Date(row.created_at).toLocaleDateString('pt-BR') + ' ' + 
                      new Date(row.created_at).toLocaleTimeString('pt-BR'),
      created_at: row.created_at
    }));
    
    return res.json({
      success: true,
      count: result.rowCount,
      data: mappedData
    });
  } catch (error) {
    console.error('[OsascoV2Direto] Erro ao buscar recebimentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos: ' + error.message
    });
  }
});

// Rota para adicionar um novo recebimento
router.post('/api/osasco-v2/recebimentos', async (req, res) => {
  try {
    console.log('[OsascoV2Direto] Registrando novo recebimento');
    const {
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota,
      data_entrega,
      operador,
      observacoes
    } = req.body;
    
    // Validação básica
    if (!fornecedor || !tipo_combustivel || !quantidade_litros || !valor_litro || !valor_total) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios incompletos'
      });
    }
    
    // Verificar se a tabela existe e criar se não existir
    const checkTableQuery = `
      CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
        id SERIAL PRIMARY KEY,
        nome_fornecedor VARCHAR(255) NOT NULL,
        tipo_produto VARCHAR(100) NOT NULL,
        litros_recebidos NUMERIC(10,2) NOT NULL,
        valor_litro NUMERIC(10,3) NOT NULL,
        valor_total NUMERIC(10,2) NOT NULL,
        numero_nota VARCHAR(100) NOT NULL,
        data_entrega DATE NOT NULL,
        nome_operador VARCHAR(255) NOT NULL,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await pool.query(checkTableQuery);
    
    // Inserir novo recebimento
    const query = `
      INSERT INTO recebimentos_posto_osasco_v2 (
        nome_fornecedor,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        numero_nota,
        data_entrega,
        nome_operador,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    
    const values = [
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota || '',
      data_entrega || new Date(),
      operador || 'Sistema',
      observacoes || null
    ];
    
    const result = await pool.query(query, values);
    console.log('[OsascoV2Direto] Recebimento registrado com sucesso');
    
    // Mapear o resultado para o formato esperado pela interface
    const row = result.rows[0];
    const mappedData = {
      id: row.id,
      fornecedor: row.nome_fornecedor,
      tipo_combustivel: row.tipo_produto,
      quantidade_litros: row.litros_recebidos,
      valor_litro: row.valor_litro,
      valor_total: row.valor_total,
      numero_nota: row.numero_nota,
      data_entrega: row.data_entrega,
      nome_operador: row.nome_operador,
      operador: row.nome_operador, // Duplicado para compatibilidade
      observacoes: row.observacoes,
      data_formatada: new Date(row.created_at).toLocaleDateString('pt-BR') + ' ' + 
                      new Date(row.created_at).toLocaleTimeString('pt-BR'),
      created_at: row.created_at
    };
    
    return res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: mappedData
    });
  } catch (error) {
    console.error('[OsascoV2Direto] Erro ao registrar recebimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento: ' + error.message
    });
  }
});

module.exports = router;
/**
 * Manipulador especializado para recebimentos do posto Osasco V2
 * Esta implementação considera a estrutura específica da tabela recebimentos_posto_osasco_v2
 */

const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// Rota para obter todos os recebimentos do posto Osasco V2
router.get('/api/recebimentos/osasco_v2', async (req, res) => {
  try {
    console.log("Buscando recebimentos para o posto Osasco V2");
    
    // Verificar se a tabela existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `;
    
    const tableExistsResult = await pool.query(checkTableQuery);
    
    if (!tableExistsResult.rows[0].exists) {
      return res.json({
        success: true,
        message: "Tabela de recebimentos para Osasco V2 não existe",
        data: []
      });
    }
    
    // Buscar recebimentos com mapeamento de colunas específico
    const query = `
      SELECT 
        id,
        nome_fornecedor as fornecedor,
        tipo_produto as tipo_combustivel,
        litros_recebidos as quantidade_litros,
        valor_litro,
        valor_total,
        numero_nota,
        data_entrega,
        nome_operador,
        observacoes,
        to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_formatada,
        created_at
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error("Erro ao buscar recebimentos do posto Osasco V2:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar recebimentos: " + error.message
    });
  }
});

// Rota para adicionar um recebimento no posto Osasco V2
router.post('/api/recebimentos/osasco_v2', async (req, res) => {
  try {
    const {
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota,
      data_entrega,
      nome_operador,
      observacoes
    } = req.body;
    
    // Verificar campos obrigatórios
    if (!fornecedor || !tipo_combustivel || !quantidade_litros || !valor_litro || !numero_nota || !data_entrega || !nome_operador) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios, exceto observações"
      });
    }
    
    // Mapeamento de campos para o formato da tabela Osasco V2
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota,
      data_entrega,
      nome_operador,
      observacoes || null
    ];
    
    const result = await pool.query(query, values);
    
    // Atualizar os níveis do tanque com base no recebimento
    // Este código será implementado quando tivermos uma tabela de configuração de tanques específica

    res.status(201).json({
      success: true,
      message: "Recebimento registrado com sucesso",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao registrar recebimento para Osasco V2:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao registrar recebimento: " + error.message
    });
  }
});

module.exports = router;
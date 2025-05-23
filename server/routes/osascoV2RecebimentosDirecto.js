/**
 * Rota especializada para os recebimentos do posto Osasco V2
 * Esta implementação acessa diretamente a tabela recebimentos_posto_osasco_v2
 */
const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Middleware de autenticação unificada
const { isAuthenticated, hasPostoAccess } = require('../middleware/auth');

// Verificar se a tabela existe
async function verificaTabelaRecebimentos() {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recebimentos_posto_osasco_v2'
      );
    `;
    const result = await pool.query(query);
    return result.rows[0].exists;
  } catch (error) {
    console.error('Erro ao verificar tabela de recebimentos Osasco V2:', error);
    return false;
  }
}

// Obter todos os recebimentos
router.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log('Consultando recebimentos do posto Osasco V2 diretamente');
    
    const tabelaExiste = await verificaTabelaRecebimentos();
    if (!tabelaExiste) {
      return res.status(404).json({
        success: false,
        message: 'Tabela de recebimentos para Osasco V2 não encontrada'
      });
    }
    
    // Consulta todos os recebimentos com mapeamento de campos correto
    const query = `
      SELECT 
        id,
        nome_fornecedor as fornecedor,
        tipo_produto as tipo_combustivel,
        litros_recebidos as quantidade_litros,
        COALESCE(valor_litro, 0) as valor_litro,
        valor_total,
        COALESCE(numero_nota, '-') as numero_nota,
        COALESCE(TO_CHAR(data_entrega, 'DD/MM/YYYY'), TO_CHAR(created_at, 'DD/MM/YYYY')) as data_entrega,
        nome_operador as operador,
        observacoes,
        created_at
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const { rows } = await pool.query(query);
    
    console.log(`Recebimentos encontrados no posto Osasco V2: ${rows.length}`);
    
    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao consultar recebimentos do posto Osasco V2:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao consultar recebimentos',
      error: error.message
    });
  }
});

// Adicionar um novo recebimento
router.post('/', isAuthenticated, async (req, res) => {
  try {
    // Validar dados
    const {
      nome_fornecedor,
      tipo_produto,
      litros_recebidos,
      valor_total,
      numero_nota,
      data_entrega,
      nome_operador,
      observacoes
    } = req.body;
    
    // Validação básica
    if (!nome_fornecedor || !tipo_produto || !litros_recebidos || !valor_total || !nome_operador) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos para registrar recebimento'
      });
    }
    
    // Calcular valor por litro
    const valor_litro = parseFloat(valor_total) / parseFloat(litros_recebidos);
    
    // Inserir na tabela
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
      nome_fornecedor,
      tipo_produto,
      litros_recebidos,
      valor_litro.toFixed(3),  // Formatar com 3 casas decimais
      valor_total,
      numero_nota || null,
      data_entrega || null,
      nome_operador,
      observacoes || null
    ];
    
    const { rows } = await pool.query(query, values);
    
    return res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: rows[0]
    });
  } catch (error) {
    console.error('Erro ao adicionar recebimento para Osasco V2:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento',
      error: error.message
    });
  }
});

module.exports = router;
/**
 * Manipulador específico para recebimentos do posto Osasco V2
 * Cria um endpoint especializado que mapeia corretamente os campos da tabela
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Endpoint para buscar recebimentos
router.get('/', async (req, res) => {
  try {
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        success: true,
        message: 'Tabela de recebimentos do posto Osasco não encontrada',
        data: []
      });
    }
    
    // Consultar colunas da tabela
    const columnsQuery = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'recebimentos_posto_osasco_v2'
    `);
    
    const columnNames = columnsQuery.rows.map(col => col.column_name);
    console.log('[RecebimentosOsasco] Colunas disponíveis:', columnNames);
    
    // Buscar registros
    const query = `
      SELECT *
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    
    // Quando não há recebimentos, retorna um array vazio
    if (result.rowCount === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Mapear resultados para o formato esperado pelo frontend
    const recebimentos = result.rows.map(row => ({
      id: row.id,
      fornecedor: row.nome_fornecedor || "Não informado",
      tipo_combustivel: row.tipo_produto || "Diesel",
      quantidade_litros: parseFloat(row.litros_recebidos || 0),
      valor_litro: parseFloat(row.valor_litro || 0),
      valor_total: parseFloat(row.valor_total || 0),
      numero_nota: row.numero_nota || "Não informado",
      data_entrega: row.data_entrega || new Date().toISOString().split('T')[0],
      operador: row.nome_operador || row.operador || "Sistema",
      observacoes: row.observacoes || "",
      created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString()
    }));
    
    console.log(`[RecebimentosOsasco] Encontrados ${recebimentos.length} recebimentos`);
    
    return res.json({
      success: true,
      data: recebimentos
    });
  } catch (error) {
    console.error('[RecebimentosOsasco] Erro ao buscar recebimentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos',
      error: error.message
    });
  }
});

// Endpoint para registrar novos recebimentos
router.post('/', async (req, res) => {
  try {
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
    
    // Validar dados obrigatórios
    if (!fornecedor || !tipo_combustivel || !quantidade_litros || !valor_litro) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. Fornecedor, tipo de combustível, quantidade e valor por litro são obrigatórios.'
      });
    }
    
    // Mapear para o formato do banco de dados
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
        observacoes,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota,
      data_entrega,
      operador,
      observacoes
    ]);
    
    const novoRecebimento = result.rows[0];
    
    return res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: novoRecebimento
    });
  } catch (error) {
    console.error('[RecebimentosOsasco] Erro ao registrar recebimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento',
      error: error.message
    });
  }
});

module.exports = router;
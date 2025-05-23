/**
 * Manipulador especializado para recebimentos do posto Osasco V2
 * Esta implementação considera a estrutura específica da tabela recebimentos_posto_osasco_v2
 */

const express = require('express');
const { pool } = require('../db');
const { verificarAutenticacao } = require('../utils/auth-utils');

const router = express.Router();

// Middleware de autenticação
router.use(verificarAutenticacao);

// Rota para obter todos os recebimentos do posto Osasco V2
router.get('/api/recebimentos/osasco_v2', async (req, res) => {
  try {
    // Verificar se a tabela existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `);

    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: true,
        message: 'Tabela de recebimentos para Osasco V2 não encontrada',
        data: []
      });
    }

    // Buscar todos os recebimentos ordenados por data
    const result = await pool.query(`
      SELECT 
        id,
        nome_fornecedor,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        numero_nota,
        data_entrega,
        nome_operador,
        observacoes,
        created_at,
        updated_at,
        to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_formatada
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      message: 'Recebimentos recuperados com sucesso',
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar recebimentos Osasco V2:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos: ' + error.message
    });
  }
});

// Rota para adicionar um novo recebimento
router.post('/api/recebimentos/osasco_v2', async (req, res) => {
  try {
    // Dados do recebimento
    const {
      nome_fornecedor,
      tipo_produto,
      litros_recebidos,
      valor_litro,
      valor_total,
      numero_nota,
      data_entrega,
      nome_operador,
      observacoes
    } = req.body;

    // Validação básica
    if (!nome_fornecedor || !tipo_produto || !litros_recebidos) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. Fornecedor, tipo de combustível e quantidade são obrigatórios.'
      });
    }

    // Inserir o recebimento
    const insertResult = await pool.query(`
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
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      nome_fornecedor,
      tipo_produto,
      litros_recebidos,
      valor_litro || null,
      valor_total || null,
      numero_nota || null,
      data_entrega || null,
      nome_operador,
      observacoes || ''
    ]);

    // Atualizar o nível do tanque com base no recebimento
    if (tipo_produto.toLowerCase().includes('diesel')) {
      // Buscar a configuração atual do tanque
      const configResult = await pool.query(`
        SELECT * FROM configuracao_tanques WHERE posto = 'Osasco_v2'
      `);

      if (configResult.rows.length > 0) {
        const config = configResult.rows[0];
        // Calcular o novo nível após o recebimento
        const novoNivel = parseFloat(config.diesel_nivel) + parseFloat(litros_recebidos);
        
        // Atualizar o nível do tanque
        await pool.query(`
          UPDATE configuracao_tanques
          SET diesel_nivel = $1, updated_at = NOW()
          WHERE posto = 'Osasco_v2'
        `, [novoNivel.toString()]);
      }
    } else if (tipo_produto.toLowerCase().includes('arla')) {
      // Buscar a configuração atual do tanque
      const configResult = await pool.query(`
        SELECT * FROM configuracao_tanques WHERE posto = 'Osasco_v2'
      `);

      if (configResult.rows.length > 0) {
        const config = configResult.rows[0];
        // Calcular o novo nível após o recebimento
        const novoNivel = parseFloat(config.arla_nivel) + parseFloat(litros_recebidos);
        
        // Atualizar o nível do tanque
        await pool.query(`
          UPDATE configuracao_tanques
          SET arla_nivel = $1, updated_at = NOW()
          WHERE posto = 'Osasco_v2'
        `, [novoNivel.toString()]);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: insertResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao registrar recebimento Osasco V2:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento: ' + error.message
    });
  }
});

module.exports = router;
/**
 * Rota especializada para os recebimentos do posto Osasco V2
 * Esta implementação acessa diretamente a tabela recebimentos_posto_osasco_v2
 */
const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Middleware de autenticação unificada
const { isAuthenticated } = require('../middleware/auth');

// Debug inicial para verificar a estrutura da tabela
async function verificarEstruturaTabelaRecebimentos() {
  try {
    console.log("[OsascoV2RecebimentosDirecto] Verificando estrutura da tabela recebimentos_posto_osasco_v2...");
    const query = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'recebimentos_posto_osasco_v2'
      ORDER BY ordinal_position;
    `;
    const result = await pool.query(query);
    console.log("[OsascoV2RecebimentosDirecto] Colunas disponíveis:", result.rows);
    return result.rows;
  } catch (error) {
    console.error("[OsascoV2RecebimentosDirecto] Erro ao verificar estrutura da tabela:", error);
    return [];
  }
}

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
    console.log('[OsascoV2RecebimentosDirecto] Consultando recebimentos do posto Osasco V2 diretamente');
    
    // Verificar estrutura da tabela antes de prosseguir
    await verificarEstruturaTabelaRecebimentos();
    
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
    
    console.log('[OsascoV2RecebimentosDirecto] Executando query:', query);
    
    const { rows } = await pool.query(query);
    
    console.log(`[OsascoV2RecebimentosDirecto] Recebimentos encontrados: ${rows.length}`);
    if (rows.length > 0) {
      console.log('[OsascoV2RecebimentosDirecto] Exemplo primeiro resultado:', rows[0]);
    }
    
    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('[OsascoV2RecebimentosDirecto] Erro ao consultar recebimentos:', error);
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
    console.log('[OsascoV2RecebimentosDirecto] Recebendo pedido para adicionar recebimento:', req.body);
    
    // Verificar estrutura da tabela antes de prosseguir
    await verificarEstruturaTabelaRecebimentos();
    
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
    
    // Preparar data em formato correto
    let dataEntrega = data_entrega || null;
    if (dataEntrega && typeof dataEntrega === 'string') {
      // Tentar formatar a data se ela estiver num formato diferente
      try {
        // Se for DD/MM/YYYY
        if (dataEntrega.includes('/')) {
          const parts = dataEntrega.split('/');
          if (parts.length === 3) {
            dataEntrega = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
      } catch (err) {
        console.warn('[OsascoV2RecebimentosDirecto] Erro ao processar data, usando original:', err);
      }
    }
    
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
      dataEntrega,
      nome_operador,
      observacoes || null
    ];
    
    console.log('[OsascoV2RecebimentosDirecto] Executando query com valores:', values);
    
    const { rows } = await pool.query(query, values);
    
    console.log('[OsascoV2RecebimentosDirecto] Recebimento registrado com sucesso:', rows[0]);
    
    return res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: rows[0]
    });
  } catch (error) {
    console.error('[OsascoV2RecebimentosDirecto] Erro ao adicionar recebimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento',
      error: error.message
    });
  }
});

module.exports = router;
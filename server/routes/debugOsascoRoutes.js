/**
 * Rotas de debug para recebimentos do posto Osasco
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/recebimentos', async (req, res) => {
  try {
    const nomeTabela = 'recebimentos_posto_osasco_v2';
    
    // Consulta direta para verificar se existem registros e obter os dados
    const query = `
      SELECT COUNT(*) FROM ${nomeTabela}
    `;
    
    const countResult = await pool.query(query);
    const count = parseInt(countResult.rows[0].count);
    
    console.log(`[DEBUG-Osasco] Contagem de registros em ${nomeTabela}: ${count}`);
    
    if (count === 0) {
      console.log(`[DEBUG-Osasco] Nenhum registro encontrado na tabela.`);
      return res.json({
        success: true,
        data: [],
      });
    }
    
    // Se existirem registros, buscar os dados
    const selectQuery = `
      SELECT * FROM ${nomeTabela}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const result = await pool.query(selectQuery);
    console.log(`[DEBUG-Osasco] Registros obtidos: ${result.rowCount}`);
    
    // Criar array de dados manualmente
    const recebimentosData = [];
    
    for (const row of result.rows) {
      // Calcular valor por litro se não existir
      let valorLitro = 0;
      if (parseFloat(row.litros_recebidos) > 0) {
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
    
    // Retornar os dados formatados
    return res.json({
      success: true,
      data: recebimentosData
    });
    
  } catch (error) {
    console.error(`[DEBUG-Osasco] Erro ao buscar recebimentos:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos do posto Osasco V2',
      error: error.message
    });
  }
});

module.exports = router;
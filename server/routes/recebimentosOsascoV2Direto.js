/**
 * Rota especializada para os recebimentos do posto Osasco V2
 * Esta implementação acessa diretamente a tabela recebimentos_posto_osasco_v2
 * e faz o mapeamento correto dos campos
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Função para mapear os nomes dos campos do banco para o formato esperado pelo frontend
function mapearCamposRecebimento(item) {
  return {
    id: item.id,
    fornecedor: item.nome_fornecedor,
    tipo_combustivel: item.tipo_produto,
    quantidade_litros: parseFloat(item.litros_recebidos),
    valor_litro: parseFloat(item.valor_litro || 0),
    valor_total: parseFloat(item.valor_total),
    numero_nota: item.numero_nota || '-',
    data_entrega: item.data_entrega ? 
      new Date(item.data_entrega).toLocaleDateString('pt-BR') : 
      new Date(item.created_at).toLocaleDateString('pt-BR'),
    operador: item.nome_operador,
    observacoes: item.observacoes,
    created_at: item.created_at
  };
}

// Rota para obter todos os recebimentos do posto Osasco V2
router.get('/api/recebimentos-osasco-v2/todos', async (req, res) => {
  try {
    console.log("Buscando todos os recebimentos do posto Osasco V2...");
    
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        success: true,
        message: "Tabela de recebimentos do posto Osasco V2 não encontrada",
        data: []
      });
    }
    
    // Buscar os recebimentos
    const result = await pool.query(`
      SELECT * FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
    `);
    
    // Converter para o formato esperado pelo frontend
    const recebimentos = result.rows.map(mapearCamposRecebimento);
    
    console.log(`Encontrados ${recebimentos.length} recebimentos`);
    
    return res.json({
      success: true,
      data: recebimentos
    });
  } catch (error) {
    console.error("Erro ao buscar recebimentos do posto Osasco V2:", error);
    return res.status(500).json({
      success: false,
      message: `Erro ao buscar recebimentos: ${error.message}`
    });
  }
});

module.exports = router;
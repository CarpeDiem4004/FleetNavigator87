/**
 * Rotas específicas para postos de abastecimento
 * Adicionando funcionalidades especiais para garantir atualização imediata
 */

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Endpoint para refresh forçado de histórico
router.post('/refresh-historico/:posto', async (req, res) => {
  try {
    // Desativar cache para garantir dados frescos
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Extrair nome do posto dos parâmetros 
    let posto = req.params.posto.toLowerCase();
    
    // Normalizar nome do posto
    posto = posto.replace(/\s+/g, '_').replace(/v2/i, 'v2');
    
    console.log(`[REFRESH] Solicitado refresh de histórico para posto ${posto}`);
    
    // Executar uma consulta SELECT para garantir dados mais recentes
    const consultaHistorico = `
      SELECT id, created_at, placa 
      FROM abastecimentos_posto_${posto}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const resultadoHistorico = await pool.query(consultaHistorico);
    
    // Executar um comando especial que forçará o refresh do cache interno da view
    const refreshViewCmd = `
      REFRESH MATERIALIZED VIEW IF EXISTS historico_consolidado_abastecimentos;
      SELECT true as refreshed;
    `;
    
    await pool.query(refreshViewCmd);
    
    // Responder com timestamp para controle de refresh no cliente
    res.json({
      success: true,
      refreshed: true,
      posto: posto,
      dados: resultadoHistorico.rows,
      dataHora: new Date().toISOString()
    });
  } catch (error) {
    console.error('[REFRESH-POSTO] Erro ao executar refresh de histórico:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar histórico'
    });
  }
});

// Rota para atualização direta da tabela de abastecimentos
router.post('/registrar-direto/:posto', async (req, res) => {
  try {
    // Extrair dados da requisição
    const { abastecimento } = req.body;
    const posto = req.params.posto.toLowerCase().replace(/\s+/g, '_');
    
    if (!abastecimento) {
      return res.status(400).json({
        success: false,
        error: 'Dados de abastecimento não fornecidos'
      });
    }
    
    console.log(`[DIRETO] Registrando abastecimento direto para posto ${posto}:`, abastecimento);
    
    // Criar comando de inserção específico para o posto
    const consultaInsercao = `
      INSERT INTO abastecimentos_posto_${posto} (
        placa, 
        km_atual, 
        tipo_combustivel, 
        litros, 
        valor_litro, 
        valor_total, 
        project,
        tipo_veiculo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `;
    
    // Executar a inserção com os dados fornecidos
    const valores = [
      abastecimento.placa,
      abastecimento.km_atual,
      abastecimento.tipo_combustivel,
      abastecimento.litros,
      abastecimento.valor_litro,
      abastecimento.valor_total,
      abastecimento.projeto,
      abastecimento.tipo_veiculo || 'frota'
    ];
    
    const resultado = await pool.query(consultaInsercao, valores);
    
    // Responder com o registro criado
    res.json({
      success: true,
      message: 'Abastecimento registrado com sucesso',
      data: resultado.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DIRETO] Erro ao registrar abastecimento direto:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao registrar abastecimento'
    });
  }
});

export default router;
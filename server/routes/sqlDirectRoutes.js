/**
 * Rotas para executar SQL diretamente
 * Para uso exclusivo em operações de alta prioridade
 */

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Rota para executar SQL diretamente
router.post('/execute', async (req, res) => {
  try {
    // Desativar cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const { sql, params = [], refreshCache = true } = req.body;
    
    // Verificação de segurança básica
    if (sql.toLowerCase().includes('drop') || 
        sql.toLowerCase().includes('delete') || 
        sql.toLowerCase().includes('truncate')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Operações destrutivas não são permitidas' 
      });
    }
    
    console.log(`[SQL-DIRECT] Executando consulta: ${sql.substring(0, 100)}...`);
    
    // Execute a consulta com retry em caso de falha
    let result;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        result = await pool.query(sql, params);
        break; // Sucesso, saia do loop
      } catch (queryError) {
        attempts++;
        console.error(`[SQL-DIRECT] Tentativa ${attempts} falhou:`, queryError);
        if (attempts >= maxAttempts) throw queryError;
        await new Promise(resolve => setTimeout(resolve, 200)); // Aguardar 200ms antes da próxima tentativa
      }
    }
    
    // Responder com os dados
    res.json({
      success: true, 
      rows: result?.rows || [], 
      rowCount: result?.rowCount || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SQL-DIRECT] Erro ao executar SQL:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro ao executar consulta SQL'
    });
  }
});

// Rota específica para consulta de histórico otimizada
router.post('/historico-abastecimentos/:posto', async (req, res) => {
  try {
    // Desativar cache completamente
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Obter o nome do posto dos parâmetros
    let posto = req.params.posto.toLowerCase();
    
    // Normalizar o nome do posto (remover espaços, converter para minúsculas)
    posto = posto.replace(/ /g, '_').replace(/v2/i, 'v2');
    
    // Construir a consulta SQL
    const sql = `
      SELECT 
        id,
        placa,
        km_atual as km,
        NULL as hodometro_atual,
        tipo_combustivel,
        litros as quantidade_litros,
        'Não informado' as nome_motorista,
        NULL as rg_motorista,
        'Sistema' as nome_operador,
        valor_litro,
        valor_total,
        tipo_veiculo,
        observacoes,
        false as lavagem,
        NULL as tipo_lavagem,
        COALESCE(project, 'Não definido') as projeto,
        to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora,
        created_at
      FROM abastecimentos_posto_${posto}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    console.log(`[SQL-HISTORICO] Executando consulta para posto ${posto}`);
    const result = await pool.query(sql);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: posto,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SQL-HISTORICO] Erro ao executar consulta de histórico:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao consultar histórico'
    });
  }
});

export default router;
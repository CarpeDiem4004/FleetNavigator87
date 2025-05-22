/**
 * Rotas especializadas para o posto Guarulhos V2
 * 
 * Este arquivo contém rotas otimizadas para o posto Guarulhos V2 que mantêm
 * todos os campos originais, incluindo nome_motorista e rg_motorista.
 */

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Rota otimizada para histórico de Guarulhos V2
router.get('/historico', async (req, res) => {
  try {
    // Consulta SQL otimizada para Guarulhos V2 que mantém os campos originais
    const query = `
      SELECT 
        id,
        placa,
        km_atual as km,
        NULL as hodometro_atual,
        tipo_combustivel,
        litros as quantidade_litros,
        nome_motorista,
        rg_motorista,
        nome_operador,
        valor_litro,
        valor_total,
        tipo_veiculo,
        observacoes,
        false as lavagem,
        NULL as tipo_lavagem,
        COALESCE(projeto, 'Não definido') as projeto,
        to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
        created_at
      FROM abastecimentos_posto_guarulhos_v2
      ORDER BY created_at DESC
      LIMIT ${req.query.limit || 50}
    `;
    
    console.log("[GuarulhosV2] Executando consulta especializada de histórico que preserva valores reais dos campos");
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error("[GuarulhosV2] Erro ao consultar histórico especializado:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Erro ao consultar histórico especializado" 
    });
  }
});

// Rota para recebimentos do posto Guarulhos V2
router.get('/recebimentos', async (req, res) => {
  try {
    // Verificar se a tabela recebimentos_posto_guarulhos_v2 existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_guarulhos_v2'
      );
    `;
    
    const tableCheck = await pool.query(checkTableQuery);
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      // Se a tabela não existir, retornar uma lista vazia com mensagem amigável
      return res.json({
        success: true,
        message: "Tabela de recebimentos ainda não configurada para este posto",
        data: [],
        count: 0
      });
    }
    
    // Consulta SQL para recebimentos do posto Guarulhos V2
    const query = `
      SELECT 
        id,
        placa,
        tipo_combustivel,
        quantidade_litros,
        valor_litro,
        valor_total,
        motorista,
        operador,
        observacoes,
        to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
        created_at
      FROM recebimentos_posto_guarulhos_v2
      ORDER BY created_at DESC
      LIMIT ${req.query.limit || 50}
    `;
    
    console.log("[GuarulhosV2] Executando consulta especializada de recebimentos");
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error("[GuarulhosV2] Erro ao consultar recebimentos:", error);
    
    // Retornar uma resposta de sucesso com dados vazios para evitar quebra da interface
    res.json({ 
      success: true, 
      message: "Tabela de recebimentos não disponível ou erro na consulta",
      data: [],
      count: 0
    });
  }
});

// Exportar o router para ser usado em routes.ts
export default router;
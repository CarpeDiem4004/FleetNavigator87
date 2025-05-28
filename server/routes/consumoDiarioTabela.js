import express from 'express';
const router = express.Router();
import { pool } from '../database.js';
import { unifiedAuthMiddleware, requireRoles } from '../utils/auth-utils.js';

/**
 * Endpoint para dados da tabela de consumo diário
 * GET /api/consumo-diario-tabela
 */
router.get('/', unifiedAuthMiddleware, requireRoles(['admin', 'gestor']), async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30;
    
    // Consulta na tabela de histórico consolidado
    const query = `
      SELECT 
        data_coleta as data,
        posto,
        litros_consumidos as litros,
        numero_abastecimentos as carros,
        valor_total
      FROM consumo_diario_historico
      WHERE data_coleta >= CURRENT_DATE - INTERVAL '${dias} days'
      ORDER BY data_coleta DESC, posto
    `;
    
    const result = await pool.query(query);
    
    // Agrupar dados por data
    const dadosAgrupados = {};
    
    result.rows.forEach(row => {
      // Converter para data local do Brasil (UTC-3)
      const dataUTC = new Date(row.data);
      const dataBrasil = new Date(dataUTC.getTime() - (3 * 60 * 60 * 1000));
      const data = dataBrasil.toISOString().split('T')[0];
      
      if (!dadosAgrupados[data]) {
        dadosAgrupados[data] = {
          data: data,
          dia: new Date(data).getDate(),
          osasco_v2: 0,
          alair_v2: 0,
          campinas_v2: 0,
          abc_v2: 0,
          socorro_v2: 0,
          sorocaba_v2: 0,
          total: 0
        };
      }
      
      const posto = row.posto.toLowerCase();
      const litros = parseFloat(row.litros) || 0;
      
      dadosAgrupados[data][posto] = litros;
      dadosAgrupados[data].total += litros;
    });
    
    // Converter para array e ordenar
    const dadosFinais = Object.values(dadosAgrupados).sort((a, b) => 
      new Date(b.data) - new Date(a.data)
    );
    
    res.json({
      success: true,
      data: dadosFinais,
      totalRegistros: dadosFinais.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados de consumo diário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
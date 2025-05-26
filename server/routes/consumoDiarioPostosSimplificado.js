import express from 'express';
const router = express.Router();
import { pool } from '../database.js';
import { unifiedAuthMiddleware, requireRoles } from '../utils/auth-utils.js';

/**
 * Obtém o consumo diário de todos os postos
 * GET /api/consumo-diario-postos-simplificado
 */
router.get('/', unifiedAuthMiddleware, requireRoles(['admin', 'gestor']), async (req, res) => {
  try {
    // Lista dos 6 postos específicos que devem ser exibidos (APENAS com final _v2)
    const postosPermitidos = ['abc_v2', 'alair_v2', 'campinas_v2', 'osasco_v2', 'socorro_v2', 'sorocaba_v2'];
    
    // Consulta para obter APENAS as tabelas dos 6 postos específicos
    const tabelasQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'abastecimentos_posto_%'
      AND table_name NOT LIKE '%_comparativo_%'
      AND table_name NOT LIKE '%_consumo_%'
      AND table_name NOT LIKE '%_estatisticas_%'
      AND table_name NOT LIKE '%_ultimos%'
      AND table_name NOT LIKE '%_consolidado%'
      AND table_schema = 'public'
      AND (
        table_name = 'abastecimentos_posto_abc_v2' OR
        table_name = 'abastecimentos_posto_alair_v2' OR
        table_name = 'abastecimentos_posto_campinas_v2' OR
        table_name = 'abastecimentos_posto_osasco_v2' OR
        table_name = 'abastecimentos_posto_socorro_v2' OR
        table_name = 'abastecimentos_posto_sorocaba_v2'
      )
      ORDER BY table_name
    `;
    
    const tabelasResult = await pool.query(tabelasQuery);
    const tabelas = tabelasResult.rows.map(row => row.table_name);
    
    if (tabelas.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'Nenhuma tabela de abastecimento encontrada.'
      });
    }
    
    // Período da consulta - últimos 30 dias por padrão
    const dias = parseInt(req.query.dias) || 30;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];
    
    // Resultado a ser retornado
    const resultado = [];
    
    // Para cada tabela, consultar o consumo diário
    for (const tabela of tabelas) {
      // Extrair o nome do posto da tabela
      const nomePostoMatch = tabela.match(/abastecimentos_posto_(.+)/);
      if (!nomePostoMatch) continue;
      
      const nomePosto = nomePostoMatch[1].toUpperCase().replace(/_/g, ' ');
      
      try {
        // Consulta para obter o consumo diário
        const query = `
          SELECT 
            DATE(created_at) as data,
            SUM(COALESCE(litros, quantidade_litros, 0)) as litros,
            COUNT(*) as abastecimentos
          FROM ${tabela}
          WHERE created_at >= $1
          GROUP BY DATE(created_at)
          ORDER BY data DESC
        `;
        
        const consumoResult = await pool.query(query, [dataLimiteStr]);
        
        // Cálculo do total e média
        let totalLitros = 0;
        let totalAbastecimentos = 0;
        const diasComRegistro = consumoResult.rows.length;
        
        consumoResult.rows.forEach(row => {
          totalLitros += parseFloat(row.litros || 0);
          totalAbastecimentos += parseInt(row.abastecimentos || 0);
        });
        
        // Média diária considerando apenas dias com registro
        const mediaDiaria = diasComRegistro > 0 ? (totalLitros / diasComRegistro) : 0;
        
        resultado.push({
          posto: nomePosto,
          tabelaOrigem: tabela,
          consumoDiario: consumoResult.rows,
          resumo: {
            totalLitros,
            totalAbastecimentos,
            mediaDiaria,
            diasComRegistro
          }
        });
      } catch (tableError) {
        console.error(`Erro ao consultar tabela ${tabela}:`, tableError);
        // Continuar com a próxima tabela se houver erro
        continue;
      }
    }
    
    // Ordenar por consumo total (decrescente)
    resultado.sort((a, b) => b.resumo.totalLitros - a.resumo.totalLitros);
    
    res.status(200).json({
      success: true,
      data: resultado,
      params: {
        dias
      }
    });
  } catch (error) {
    console.error('Erro ao obter consumo diário de postos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dados de consumo diário',
      error: error.message
    });
  }
});

export default router;
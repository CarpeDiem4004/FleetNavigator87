/**
 * API para obtenção de dados de consumo diário dos postos
 * Permite visualizar o consumo agrupado por dia e por posto
 */

import express from 'express';
import { pool } from '../database';
import { unifiedAuthMiddleware, requireRoles } from '../utils/auth-utils';

const router = express.Router();

/**
 * Obtém o consumo diário de todos os postos
 * GET /api/consumo-diario-postos
 */
router.get('/', unifiedAuthMiddleware, requireRoles(['admin', 'gestor']), async (req, res) => {
  try {
    // Consulta para obter as tabelas de abastecimento existentes
    const tabelasQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'abastecimentos_posto_%'
      AND table_schema = 'public'
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
    const dias = parseInt(req.query.dias as string) || 30;
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
      
      // Consulta para obter o consumo diário
      const query = `
        SELECT 
          DATE(created_at) as data,
          SUM(COALESCE(quantidade_litros, litros, 0)) as litros,
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
        totalLitros += parseFloat(row.litros);
        totalAbastecimentos += parseInt(row.abastecimentos);
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
  } catch (error: any) {
    console.error('Erro ao obter consumo diário de postos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dados de consumo diário',
      error: error.message
    });
  }
});

/**
 * Obtém o consumo diário de um posto específico
 * GET /api/consumo-diario-postos/:posto
 */
router.get('/:posto', unifiedAuthMiddleware, requireRoles(['admin', 'gestor', 'operador']), async (req, res) => {
  try {
    const { posto } = req.params;
    
    // Verificar se a tabela existe
    const tabelaQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = $1
      AND table_schema = 'public'
    `;
    
    const tabelaResult = await pool.query(tabelaQuery, [`abastecimentos_posto_${posto.toLowerCase()}`]);
    
    if (tabelaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Posto ${posto} não encontrado.`
      });
    }
    
    const tabela = tabelaResult.rows[0].table_name;
    
    // Período da consulta - últimos 30 dias por padrão
    const dias = parseInt(req.query.dias as string) || 30;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];
    
    // Consulta para obter o consumo diário
    const query = `
      SELECT 
        DATE(created_at) as data,
        SUM(COALESCE(quantidade_litros, litros, 0)) as litros,
        COUNT(*) as abastecimentos
      FROM ${tabela}
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY data DESC
    `;
    
    const consumoResult = await pool.query(query, [dataLimiteStr]);
    
    // Consulta para obter os últimos abastecimentos detalhados
    const ultimosAbastecimentosQuery = `
      SELECT 
        id,
        created_at as data_hora,
        placa,
        COALESCE(quantidade_litros, litros, 0) as litros,
        COALESCE(km_atual, km, 0) as km,
        COALESCE(motorista, motorista_nome, '') as motorista,
        COALESCE(projeto, '') as projeto
      FROM ${tabela}
      WHERE created_at >= $1
      ORDER BY created_at DESC
      LIMIT 100
    `;
    
    const ultimosAbastecimentosResult = await pool.query(ultimosAbastecimentosQuery, [dataLimiteStr]);
    
    // Cálculo do total e média
    let totalLitros = 0;
    let totalAbastecimentos = 0;
    const diasComRegistro = consumoResult.rows.length;
    
    consumoResult.rows.forEach(row => {
      totalLitros += parseFloat(row.litros);
      totalAbastecimentos += parseInt(row.abastecimentos);
    });
    
    // Média diária considerando apenas dias com registro
    const mediaDiaria = diasComRegistro > 0 ? (totalLitros / diasComRegistro) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        posto: posto.toUpperCase().replace(/_/g, ' '),
        tabelaOrigem: tabela,
        consumoDiario: consumoResult.rows,
        ultimosAbastecimentos: ultimosAbastecimentosResult.rows,
        resumo: {
          totalLitros,
          totalAbastecimentos,
          mediaDiaria,
          diasComRegistro
        }
      },
      params: {
        dias
      }
    });
  } catch (error: any) {
    console.error(`Erro ao obter consumo diário do posto ${req.params.posto}:`, error);
    res.status(500).json({
      success: false,
      message: `Erro ao obter dados de consumo diário do posto ${req.params.posto}`,
      error: error.message
    });
  }
});

export default router;
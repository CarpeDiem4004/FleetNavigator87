/**
 * API direta que evita a interceptação do Vite
 * Este arquivo define rotas que são registradas antes do middleware do Vite
 */

import { Pool } from 'pg';
import { formatPostoName } from './utils/posto-utils.js';

// Conexão direta com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função para obter histórico de um posto específico da view consolidada
export async function getHistoricoPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const postoName = formatPostoName(req.params.posto);
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_consolidado`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View consolidada para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}" ORDER BY data_hora DESC LIMIT 50`;
    const result = await pool.query(dataQuery);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar histórico da view para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar histórico: ${error.message}` 
    });
  }
}

// Função para obter estatísticas mensais
export async function getEstatisticasMensaisPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const postoName = formatPostoName(req.params.posto);
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_estatisticas_mensais`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View de estatísticas mensais para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}" ORDER BY ano DESC, mes DESC LIMIT 12`;
    const result = await pool.query(dataQuery);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar estatísticas mensais para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar estatísticas mensais: ${error.message}` 
    });
  }
}

// Função para obter consumo por veículo
export async function getConsumoPorVeiculoPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const postoName = formatPostoName(req.params.posto);
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_consumo_por_veiculo`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View de consumo por veículo para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}" ORDER BY total_litros DESC LIMIT 20`;
    const result = await pool.query(dataQuery);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar consumo por veículo para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar consumo por veículo: ${error.message}` 
    });
  }
}

// Função para obter comparativo entre diesel e ARLA
export async function getComparativoCombustiveisPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const postoName = formatPostoName(req.params.posto);
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_comparativo_combustiveis`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View de comparativo de combustíveis para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}"`;
    const result = await pool.query(dataQuery);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar comparativo de combustíveis para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar comparativo de combustíveis: ${error.message}` 
    });
  }
}

// Função para verificar se a tabela existe
export async function checkTabelaPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    const postoName = formatPostoName(req.params.posto);
    const tableName = `abastecimentos_posto_${postoName.toLowerCase()}`;
    
    // Verificar se a tabela existe
    const tableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const tableResult = await pool.query(tableQuery, [tableName]);
    
    // Verificar se a view consolidada existe
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_consolidado`;
    const viewQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const viewResult = await pool.query(viewQuery, [viewName]);
    
    res.json({
      success: true,
      data: {
        table: tableResult.rows[0].exists,
        view: viewResult.rows[0].exists,
        tableName,
        viewName
      }
    });
  } catch (error) {
    console.error('Erro ao verificar tabela de posto:', error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao verificar tabela: ${error.message}` 
    });
  }
}
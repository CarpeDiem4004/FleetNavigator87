import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { pool } from '../db';

const router = Router();

/**
 * Função para buscar movimentações de pátio
 * Consolida dados de diversas tabelas de movimentações dos diferentes postos
 */
async function getMovimentacoesPatio(req: Request, res: Response) {
  try {
    console.log('[PatioRoutes] Consultando movimentações de pátio');
    
    // Array para armazenar todos os resultados
    let movimentacoes: any[] = [];
    
    // 1. Buscar dados da tabela principal
    try {
      const query = `
        SELECT 
          id, 
          placa, 
          tipo_veiculo, 
          motorista, 
          data_entrada, 
          data_saida, 
          motivo, 
          observacoes, 
          posto, 
          created_at,
          nome_motorista,
          nome_operador,
          tipo_movimento
        FROM movimentacoes_patio
        ORDER BY created_at DESC
        LIMIT 500
      `;
      
      const result = await pool.query(query);
      
      if (result.rows) {
        console.log(`[PatioRoutes] Encontradas ${result.rows.length} movimentações na tabela principal`);
        movimentacoes = [...result.rows];
      }
    } catch (error) {
      console.error('[PatioRoutes] Erro ao buscar tabela principal:', error);
      // Continuamos o processamento mesmo com erro
    }
    
    // 2. Buscar dados da tabela do posto Alair_v2
    try {
      const query = `
        SELECT 
          id, 
          placa, 
          tipo_veiculo, 
          motorista, 
          data_hora,
          NULL as data_saida,
          tipo_movimentacao as motivo, 
          observacoes, 
          'Alair_v2' as posto, 
          created_at,
          motorista as nome_motorista,
          usuario_operador as nome_operador,
          tipo_movimentacao as tipo_movimento
        FROM movimentacoes_patio_alair_v2
        ORDER BY created_at DESC
        LIMIT 200
      `;
      
      const result = await pool.query(query);
      
      if (result.rows) {
        console.log(`[PatioRoutes] Encontradas ${result.rows.length} movimentações na tabela Alair_v2`);
        
        // Mapear os dados para ter a mesma estrutura da tabela principal
        const dadosFormatados = result.rows.map(item => ({
          ...item,
          data_entrada: item.data_hora,
          data_saida: null
        }));
        
        movimentacoes = [...movimentacoes, ...dadosFormatados];
      }
    } catch (error) {
      console.error('[PatioRoutes] Erro ao buscar tabela Alair_v2:', error);
      // Continuamos o processamento mesmo com erro
    }
    
    // 3. Buscar dados da tabela do posto Campinas_v2
    try {
      const query = `
        SELECT 
          id, 
          placa, 
          tipo_veiculo, 
          motorista, 
          data_hora,
          NULL as data_saida,
          tipo_movimentacao as motivo, 
          observacoes, 
          'Campinas_v2' as posto, 
          created_at,
          motorista as nome_motorista,
          usuario_operador as nome_operador,
          tipo_movimentacao as tipo_movimento
        FROM movimentacoes_patio_campinas_v2
        ORDER BY created_at DESC
        LIMIT 200
      `;
      
      const result = await pool.query(query);
      
      if (result.rows) {
        console.log(`[PatioRoutes] Encontradas ${result.rows.length} movimentações na tabela Campinas_v2`);
        
        // Mapear os dados para ter a mesma estrutura da tabela principal
        const dadosFormatados = result.rows.map(item => ({
          ...item,
          data_entrada: item.data_hora,
          data_saida: null
        }));
        
        movimentacoes = [...movimentacoes, ...dadosFormatados];
      }
    } catch (error) {
      console.error('[PatioRoutes] Erro ao buscar tabela Campinas_v2:', error);
      // Continuamos o processamento mesmo com erro
    }
    
    // 4. Buscar dados da tabela do posto Guarulhos_v2
    try {
      const query = `
        SELECT 
          id, 
          placa, 
          tipo_veiculo, 
          motorista, 
          data_hora,
          NULL as data_saida,
          tipo_movimentacao as motivo, 
          observacoes, 
          'Guarulhos_v2' as posto, 
          created_at,
          motorista as nome_motorista,
          usuario_operador as nome_operador,
          tipo_movimentacao as tipo_movimento
        FROM movimentacoes_patio_guarulhos_v2
        ORDER BY created_at DESC
        LIMIT 200
      `;
      
      const result = await pool.query(query);
      
      if (result.rows) {
        console.log(`[PatioRoutes] Encontradas ${result.rows.length} movimentações na tabela Guarulhos_v2`);
        
        // Mapear os dados para ter a mesma estrutura da tabela principal
        const dadosFormatados = result.rows.map(item => ({
          ...item,
          data_entrada: item.data_hora,
          data_saida: null
        }));
        
        movimentacoes = [...movimentacoes, ...dadosFormatados];
      }
    } catch (error) {
      console.error('[PatioRoutes] Erro ao buscar tabela Guarulhos_v2:', error);
      // Continuamos o processamento mesmo com erro
    }
    
    // Retornar os dados consolidados
    return res.status(200).json({
      success: true,
      data: movimentacoes,
      count: movimentacoes.length
    });
  } catch (error) {
    console.error('[PatioRoutes] Erro ao consolidar movimentações de pátio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao consultar movimentações de pátio',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Rotas
router.get('/movimentacoes', isAuthenticated, getMovimentacoesPatio);

export default router;
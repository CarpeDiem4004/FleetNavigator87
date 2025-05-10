import { Router, Request, Response } from "express";
import { isAuthenticated } from "../middleware/auth";
import { db, pool } from "../db";

const router = Router();

/**
 * Função para consolidar dados de movimentações de pátio de diferentes tabelas
 * Esta função busca os dados das tabelas específicas de cada posto e da tabela geral
 */
async function getConsolidatedPatioData() {
  try {
    let allMovimentacoes: any[] = [];
    
    // 1. Buscar dados da tabela principal
    try {
      const { rows: mainRows } = await pool.query(`
        SELECT 
          id, placa, tipo_veiculo, motorista, nome_motorista, nome_operador, 
          data_entrada, data_saida, motivo, observacoes, posto, created_at,
          tipo_movimento
        FROM movimentacoes_patio
        ORDER BY created_at DESC
        LIMIT 500
      `);
      
      console.log(`[API Pátio] Encontradas ${mainRows.length} movimentações na tabela principal`);
      allMovimentacoes = [...mainRows];
    } catch (error) {
      console.error("[API Pátio] Erro ao buscar da tabela principal:", error);
    }
    
    // 2. Buscar dados das tabelas específicas dos postos
    const tabelasPostos = [
      {
        name: 'movimentacoes_patio_alair_v2',
        posto: 'Alair_v2',
        query: `
          SELECT 
            id, placa, tipo_veiculo, motorista, 
            motorista as nome_motorista, 
            usuario_operador as nome_operador,
            data_hora as data_entrada, 
            NULL as data_saida, 
            tipo_movimentacao as motivo, 
            observacoes, 
            'Alair_v2' as posto,
            created_at,
            tipo_movimentacao as tipo_movimento
          FROM movimentacoes_patio_alair_v2
          ORDER BY created_at DESC
          LIMIT 200
        `
      },
      {
        name: 'movimentacoes_patio_campinas_v2',
        posto: 'Campinas_v2',
        query: `
          SELECT 
            id, placa, tipo_veiculo, motorista,
            COALESCE(nome_motorista, motorista) as nome_motorista,
            COALESCE(nome_operador, usuario_operador) as nome_operador,
            data_hora as data_entrada,
            NULL as data_saida,
            tipo_movimentacao as motivo,
            observacoes,
            'Campinas_v2' as posto,
            created_at,
            tipo_movimentacao as tipo_movimento
          FROM movimentacoes_patio_campinas_v2
          ORDER BY created_at DESC
          LIMIT 200
        `
      },
      {
        name: 'movimentacoes_patio_guarulhos_v2',
        posto: 'Guarulhos_v2',
        query: `
          SELECT 
            id, placa, tipo_veiculo, motorista,
            COALESCE(nome_motorista, motorista) as nome_motorista,
            COALESCE(nome_operador, usuario_operador) as nome_operador,
            COALESCE(data_entrada, data_hora) as data_entrada,
            data_saida,
            COALESCE(motivo, tipo_movimentacao) as motivo,
            observacoes,
            'Guarulhos_v2' as posto,
            created_at,
            COALESCE(tipo_movimento, tipo_movimentacao) as tipo_movimento
          FROM movimentacoes_patio_guarulhos_v2
          ORDER BY created_at DESC
          LIMIT 200
        `
      },
      {
        name: 'movimentacoes_patio_abc_v2',
        posto: 'ABC_v2',
        query: `
          SELECT 
            id, placa, tipo_veiculo, motorista,
            COALESCE(nome_motorista, motorista) as nome_motorista,
            COALESCE(nome_operador, usuario_operador) as nome_operador,
            COALESCE(data_entrada, data_hora) as data_entrada,
            data_saida,
            COALESCE(motivo, tipo_movimentacao) as motivo,
            observacoes,
            'ABC_v2' as posto,
            created_at,
            COALESCE(tipo_movimento, tipo_movimentacao) as tipo_movimento
          FROM movimentacoes_patio_abc_v2
          ORDER BY created_at DESC
          LIMIT 200
        `
      },
      {
        name: 'movimentacoes_patio_socorro_v2',
        posto: 'Socorro_v2',
        query: `
          SELECT 
            id, placa, tipo_veiculo, motorista,
            COALESCE(nome_motorista, motorista) as nome_motorista,
            COALESCE(nome_operador, usuario_operador) as nome_operador,
            COALESCE(data_entrada, data_hora) as data_entrada,
            data_saida,
            COALESCE(motivo, tipo_movimentacao) as motivo,
            observacoes,
            'Socorro_v2' as posto,
            created_at,
            COALESCE(tipo_movimento, tipo_movimentacao) as tipo_movimento
          FROM movimentacoes_patio_socorro_v2
          ORDER BY created_at DESC
          LIMIT 200
        `
      }
    ];
    
    // Executar consultas para cada tabela específica
    for (const tabela of tabelasPostos) {
      try {
        const { rows } = await pool.query(tabela.query);
        console.log(`[API Pátio] Encontradas ${rows.length} movimentações na tabela ${tabela.name}`);
        
        if (rows.length > 0) {
          allMovimentacoes = [...allMovimentacoes, ...rows];
        }
      } catch (error) {
        console.error(`[API Pátio] Erro ao buscar da tabela ${tabela.name}:`, error);
        // Continuar com as próximas tabelas mesmo se uma der erro
      }
    }
    
    // 3. Ordenar todas as movimentações por data (mais recente primeiro)
    allMovimentacoes.sort((a, b) => {
      const dateA = new Date(a.created_at || a.data_entrada || 0).getTime();
      const dateB = new Date(b.created_at || b.data_entrada || 0).getTime();
      return dateB - dateA;
    });
    
    console.log(`[API Pátio] Total de ${allMovimentacoes.length} movimentações consolidadas`);
    
    return allMovimentacoes;
  } catch (error) {
    console.error("[API Pátio] Erro ao consolidar dados de movimentações:", error);
    throw error;
  }
}

/**
 * Rota para obter todas as movimentações de pátio consolidadas
 * GET /api/patio/movimentacoes
 */
router.get("/movimentacoes", isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log("[API Pátio] Iniciando busca de movimentações de pátio consolidadas");
    
    const user = req.user;
    console.log(`[API Pátio] Usuário autenticado: ${user?.email} (${user?.role})`);
    
    const movimentacoes = await getConsolidatedPatioData();
    
    return res.status(200).json({
      success: true,
      data: movimentacoes
    });
  } catch (error) {
    console.error("[API Pátio] Erro ao buscar movimentações:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar movimentações de pátio",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

/**
 * Rota para buscar movimentações por placa
 * GET /api/patio/veiculos/:placa
 */
router.get("/veiculos/:placa", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { placa } = req.params;
    console.log(`[API Pátio] Buscando movimentações para o veículo: ${placa}`);
    
    // Buscar todas as movimentações
    const allMovimentacoes = await getConsolidatedPatioData();
    
    // Filtrar pelo número da placa (case insensitive)
    const placaUpperCase = placa.toUpperCase();
    const filteredMovimentacoes = allMovimentacoes.filter(
      m => m.placa && m.placa.toUpperCase().includes(placaUpperCase)
    );
    
    console.log(`[API Pátio] Encontradas ${filteredMovimentacoes.length} movimentações para placa ${placa}`);
    
    return res.status(200).json({
      success: true,
      data: filteredMovimentacoes
    });
  } catch (error) {
    console.error(`[API Pátio] Erro ao buscar movimentações para placa:`, error);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar movimentações do veículo",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;
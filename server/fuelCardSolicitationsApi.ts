import { Request, Response } from 'express';
import { pool } from './db';

/**
 * Obtém todas as solicitações de cartão de combustível
 */
export async function getFuelCardSolicitations(req: Request, res: Response) {
  try {
    const query = `
      SELECT * FROM solicitacoes_fuel_card
      ORDER BY 
        CASE 
          WHEN status = 'Pendente' THEN 1
          WHEN status = 'Em Análise' THEN 2
          ELSE 3
        END,
        data_solicitacao DESC
    `;
    
    const result = await pool.query(query);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0
    });
  } catch (error: any) {
    console.error('Erro ao buscar solicitações de cartão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar solicitações',
      error: error.message
    });
  }
}

/**
 * Obtém uma solicitação de cartão específica
 */
export async function getFuelCardSolicitation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    
    const query = `
      SELECT * FROM solicitacoes_fuel_card
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao buscar solicitação específica:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar solicitação',
      error: error.message
    });
  }
}

/**
 * Cria uma nova solicitação de cartão
 */
export async function createFuelCardSolicitation(req: Request, res: Response) {
  try {
    const {
      placa,
      motorista,
      valor_solicitado,
      km_veiculo,
      tipo_cartao,
      observacoes
    } = req.body;
    
    // Validação dos campos obrigatórios
    if (!placa || !motorista || !valor_solicitado) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: placa, motorista e valor_solicitado'
      });
    }
    
    const query = `
      INSERT INTO solicitacoes_fuel_card
      (placa, motorista, valor_solicitado, km_veiculo, tipo_cartao, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      placa,
      motorista,
      valor_solicitado,
      km_veiculo || null,
      tipo_cartao || null,
      observacoes || null
    ]);
    
    return res.status(201).json({
      success: true,
      message: 'Solicitação criada com sucesso',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao criar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar solicitação',
      error: error.message
    });
  }
}

/**
 * Atualiza o status de uma solicitação de cartão
 */
export async function updateFuelCardSolicitation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, atendido_por } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    
    // Validação do status
    const validStatus = ['Pendente', 'Em Análise', 'Recarga Efetuada', 'Negado'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido. Opções válidas: ' + validStatus.join(', ')
      });
    }
    
    // Verifica se a solicitação existe
    const checkQuery = `SELECT * FROM solicitacoes_fuel_card WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada'
      });
    }
    
    // Atualiza o status e informações de atendimento
    const updateQuery = `
      UPDATE solicitacoes_fuel_card
      SET 
        status = $1,
        atendido_por = $2,
        data_atendimento = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [status, atendido_por, id]);
    
    return res.status(200).json({
      success: true,
      message: 'Solicitação atualizada com sucesso',
      data: updateResult.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao atualizar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar solicitação',
      error: error.message
    });
  }
}

/**
 * Exclui uma solicitação de cartão
 */
export async function deleteFuelCardSolicitation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    
    // Verifica se a solicitação existe
    const checkQuery = `SELECT * FROM solicitacoes_fuel_card WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada'
      });
    }
    
    // Exclui a solicitação
    const deleteQuery = `DELETE FROM solicitacoes_fuel_card WHERE id = $1`;
    await pool.query(deleteQuery, [id]);
    
    return res.status(200).json({
      success: true,
      message: 'Solicitação excluída com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao excluir solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir solicitação',
      error: error.message
    });
  }
}

// Função para sincronizar com o Supabase
export async function syncWithSupabase() {
  // Implementação futura
  console.log('Sincronização com Supabase será implementada futuramente');
}
import { Express } from 'express';
import { pool } from './db';

/**
 * Registra as rotas da API para movimentação de pneus
 */
export function registerTireMoveRoutes(app: Express) {
  // Rota para listar todas as movimentações de pneus
  app.get('/api/movimentacao-pneu', async (req, res) => {
    try {
      const query = `
        SELECT mp.*, p.codigo as pneu_codigo, p.marca as pneu_marca, p.modelo as pneu_modelo, p.medida as pneu_medida
        FROM movimentacao_pneu mp
        LEFT JOIN pneus_completo p ON mp.id_pneu = p.id
        ORDER BY mp.data DESC
      `;
      
      const result = await pool.query(query);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao listar movimentações de pneus:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar movimentações de pneus',
        error: String(error)
      });
    }
  });

  // Rota para listar movimentações por ID do pneu
  app.get('/api/movimentacao-pneu/pneu/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT mp.*, p.codigo as pneu_codigo, p.marca as pneu_marca, p.modelo as pneu_modelo, p.medida as pneu_medida
        FROM movimentacao_pneu mp
        LEFT JOIN pneus_completo p ON mp.id_pneu = p.id
        WHERE mp.id_pneu = $1
        ORDER BY mp.data DESC
      `;
      
      const result = await pool.query(query, [id]);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao buscar movimentações do pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar movimentações do pneu',
        error: String(error)
      });
    }
  });

  // Rota para listar movimentações por veículo (placa)
  app.get('/api/movimentacao-pneu/veiculo/:placa', async (req, res) => {
    try {
      const { placa } = req.params;
      
      const query = `
        SELECT mp.*, p.codigo as pneu_codigo, p.marca as pneu_marca, p.modelo as pneu_modelo, p.medida as pneu_medida
        FROM movimentacao_pneu mp
        LEFT JOIN pneus_completo p ON mp.id_pneu = p.id
        WHERE mp.id_veiculo = $1
        ORDER BY mp.data DESC
      `;
      
      const result = await pool.query(query, [placa]);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao buscar movimentações do veículo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar movimentações do veículo',
        error: String(error)
      });
    }
  });

  // Rota para registrar nova movimentação de pneu
  app.post('/api/movimentacao-pneu', async (req, res) => {
    try {
      const movimentacao = req.body;
      
      // Validação básica
      if (!movimentacao.id_pneu || !movimentacao.tipo_movimentacao || !movimentacao.km) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. ID do pneu, tipo de movimentação e km são obrigatórios.'
        });
      }
      
      // Verifica se o pneu existe
      const pneuQuery = 'SELECT * FROM pneus_completo WHERE id = $1';
      const pneuResult = await pool.query(pneuQuery, [movimentacao.id_pneu]);
      
      if (pneuResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pneu não encontrado'
        });
      }
      
      // Inserir nova movimentação
      const insertQuery = `
        INSERT INTO movimentacao_pneu (
          id_pneu, id_veiculo, tipo_movimentacao, km, data,
          local, responsavel, possui_estepe, motivo, distancia_percorrida
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10
        ) RETURNING *
      `;
      
      const insertValues = [
        movimentacao.id_pneu,
        movimentacao.id_veiculo || null,
        movimentacao.tipo_movimentacao,
        movimentacao.km,
        movimentacao.data || new Date(),
        movimentacao.local || null,
        movimentacao.responsavel || null,
        movimentacao.possui_estepe || false,
        movimentacao.motivo || null,
        movimentacao.distancia_percorrida || null
      ];
      
      const insertResult = await pool.query(insertQuery, insertValues);
      
      // Se for uma montagem, atualiza o status do pneu
      if (movimentacao.tipo_movimentacao === 'montagem' && movimentacao.id_veiculo) {
        const updatePneuQuery = `
          UPDATE pneus_completo 
          SET status = 'em_uso', veiculo_placa = $1
          WHERE id = $2
        `;
        await pool.query(updatePneuQuery, [movimentacao.id_veiculo, movimentacao.id_pneu]);
      }
      
      // Se for uma remoção, atualiza o status do pneu para disponível
      if (movimentacao.tipo_movimentacao === 'remocao') {
        const updatePneuQuery = `
          UPDATE pneus_completo 
          SET status = 'estoque', veiculo_placa = NULL
          WHERE id = $1
        `;
        await pool.query(updatePneuQuery, [movimentacao.id_pneu]);
      }
      
      return res.status(201).json({
        success: true,
        message: 'Movimentação de pneu registrada com sucesso',
        data: insertResult.rows[0]
      });
    } catch (error) {
      console.error('Erro ao registrar movimentação de pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar movimentação de pneu',
        error: String(error)
      });
    }
  });

  // Atualizar uma movimentação
  app.put('/api/movimentacao-pneu/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const movimentacao = req.body;
      
      // Verificar se a movimentação existe
      const checkQuery = 'SELECT * FROM movimentacao_pneu WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Movimentação não encontrada'
        });
      }
      
      // Montar a query de atualização dinamicamente
      const fields = Object.keys(movimentacao).filter(field => field !== 'id');
      const sets = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const query = `
        UPDATE movimentacao_pneu 
        SET ${sets}
        WHERE id = $1
        RETURNING *
      `;
      
      const values = [id, ...fields.map(field => movimentacao[field])];
      
      const result = await pool.query(query, values);
      
      return res.status(200).json({
        success: true,
        message: 'Movimentação atualizada com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar movimentação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar movimentação',
        error: String(error)
      });
    }
  });

  // Excluir uma movimentação
  app.delete('/api/movimentacao-pneu/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se a movimentação existe
      const checkQuery = 'SELECT * FROM movimentacao_pneu WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Movimentação não encontrada'
        });
      }
      
      // Deletar a movimentação
      const query = 'DELETE FROM movimentacao_pneu WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      
      return res.status(200).json({
        success: true,
        message: 'Movimentação deletada com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao deletar movimentação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar movimentação',
        error: String(error)
      });
    }
  });
}
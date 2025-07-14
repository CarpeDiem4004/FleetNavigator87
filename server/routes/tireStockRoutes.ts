import { Router } from 'express';
import { pool } from '../db';
import { isAuthenticated, isSessionAuthenticated } from '../middleware/auth/index';
import { getCurrentUTC } from '../utils/timezone-utc';

const router = Router();

// Get tire stock statistics
router.get('/tire-stock/stats', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_tires,
        COUNT(CASE WHEN status = 'Em estoque' THEN 1 END) as tires_in_stock,
        COUNT(CASE WHEN status = 'Em uso' THEN 1 END) as tires_in_use,
        COUNT(CASE WHEN status = 'Descartado' THEN 1 END) as tires_discarded,
        COALESCE(SUM(valor_unitario::numeric), 0) as total_value,
        COALESCE(AVG(valor_unitario::numeric), 0) as average_value
      FROM pneus_estoque
    `;
    
    const result = await pool.query(query);
    const stats = result.rows[0];
    
    res.json({
      totalTires: parseInt(stats.total_tires),
      tiresInStock: parseInt(stats.tires_in_stock),
      tiresInUse: parseInt(stats.tires_in_use),
      tiresDiscarded: parseInt(stats.tires_discarded),
      totalValue: parseFloat(stats.total_value),
      averageValue: parseFloat(stats.average_value)
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas de estoque:', error);
    res.status(500).json({ message: `Erro ao buscar estatísticas: ${error.message}` });
  }
});

// Get all tire stock with filters
router.get('/tire-stock', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { status, localizacao, marca, tipo } = req.query;
    
    let queryParams = [];
    let whereConditions = [];
    let paramCount = 1;
    
    if (status) {
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }
    
    if (localizacao) {
      whereConditions.push(`localizacao ILIKE $${paramCount}`);
      queryParams.push(`%${localizacao}%`);
      paramCount++;
    }
    
    if (marca) {
      whereConditions.push(`marca ILIKE $${paramCount}`);
      queryParams.push(`%${marca}%`);
      paramCount++;
    }
    
    if (tipo) {
      whereConditions.push(`tipo = $${paramCount}`);
      queryParams.push(tipo);
      paramCount++;
    }
    
    let query = `
      SELECT 
        id, dot, numero_serie, modelo, medida, tipo, status, 
        localizacao, data_entrada, valor_unitario, marca, 
        observacoes, created_at, updated_at
      FROM pneus_estoque
    `;
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar estoque de pneus:', error);
    res.status(500).json({ message: `Erro ao listar estoque: ${error.message}` });
  }
});

// Get tire stock by ID
router.get('/tire-stock/:id', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM pneus_estoque WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pneu não encontrado no estoque' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(`Erro ao buscar pneu ${req.params.id}:`, error);
    res.status(500).json({ message: `Erro ao buscar pneu: ${error.message}` });
  }
});

// Create new tire stock entry
router.post('/tire-stock', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const {
      dot, numeroSerie, modelo, medida, tipo, status, 
      localizacao, valorUnitario, marca, observacoes
    } = req.body;
    
    // Validate required fields
    if (!dot || !numeroSerie || !modelo || !medida || !tipo || !status || !localizacao || !marca) {
      return res.status(400).json({ 
        message: 'Todos os campos obrigatórios devem ser preenchidos' 
      });
    }
    
    const currentTime = getCurrentUTC();
    
    const query = `
      INSERT INTO pneus_estoque (
        dot, numero_serie, modelo, medida, tipo, status,
        localizacao, data_entrada, valor_unitario, marca, observacoes,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *
    `;
    
    const result = await pool.query(query, [
      dot, numeroSerie, modelo, medida, tipo, status,
      localizacao, currentTime, valorUnitario, marca, observacoes,
      currentTime, currentTime
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar entrada de estoque:', error);
    res.status(500).json({ message: `Erro ao criar entrada: ${error.message}` });
  }
});

// Update tire stock entry
router.put('/tire-stock/:id', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const currentTime = getCurrentUTC();
    updateData.updated_at = currentTime;
    
    const keys = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE pneus_estoque 
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, [...values, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pneu não encontrado no estoque' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar entrada de estoque:', error);
    res.status(500).json({ message: `Erro ao atualizar entrada: ${error.message}` });
  }
});

// Delete tire stock entry
router.delete('/tire-stock/:id', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tire is currently mounted
    const mountingCheck = await pool.query(
      'SELECT id FROM pneus_montagens WHERE id_pneu = $1 AND desmontado = false',
      [id]
    );
    
    if (mountingCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir pneu que está atualmente montado' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM pneus_estoque WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pneu não encontrado no estoque' });
    }
    
    res.json({ message: 'Pneu excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir entrada de estoque:', error);
    res.status(500).json({ message: `Erro ao excluir entrada: ${error.message}` });
  }
});

// Get all tire mountings with filters
router.get('/tire-mounting', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { placaVeiculo, desmontado } = req.query;
    
    let queryParams = [];
    let whereConditions = [];
    let paramCount = 1;
    
    if (placaVeiculo) {
      whereConditions.push(`tm.placa_veiculo = $${paramCount}`);
      queryParams.push(placaVeiculo);
      paramCount++;
    }
    
    if (desmontado !== undefined) {
      whereConditions.push(`tm.desmontado = $${paramCount}`);
      queryParams.push(desmontado === 'true');
      paramCount++;
    }
    
    let query = `
      SELECT 
        tm.*, 
        te.dot, te.numero_serie, te.modelo, te.medida, te.marca, te.tipo
      FROM pneus_montagens tm
      JOIN pneus_estoque te ON tm.id_pneu = te.id
    `;
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY tm.data_montagem DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar montagens:', error);
    res.status(500).json({ message: `Erro ao listar montagens: ${error.message}` });
  }
});

// Create new tire mounting
router.post('/tire-mounting', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const {
      idPneu, placaVeiculo, posicao, kmMontagem, responsavel
    } = req.body;
    
    // Validate required fields
    if (!idPneu || !placaVeiculo || !posicao || !kmMontagem || !responsavel) {
      return res.status(400).json({ 
        message: 'Todos os campos obrigatórios devem ser preenchidos' 
      });
    }
    
    const currentTime = getCurrentUTC();
    
    // Check if tire is available for mounting
    const tireCheck = await pool.query(
      'SELECT status FROM pneus_estoque WHERE id = $1',
      [idPneu]
    );
    
    if (tireCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pneu não encontrado no estoque' });
    }
    
    if (tireCheck.rows[0].status !== 'Em estoque') {
      return res.status(400).json({ 
        message: 'Pneu não está disponível para montagem' 
      });
    }
    
    // Check if there's already a tire mounted in this position
    const positionCheck = await pool.query(
      'SELECT id FROM pneus_montagens WHERE placa_veiculo = $1 AND posicao = $2 AND desmontado = false',
      [placaVeiculo, posicao]
    );
    
    if (positionCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Já existe um pneu montado nesta posição' 
      });
    }
    
    // Create mounting record
    const mountingQuery = `
      INSERT INTO pneus_montagens (
        id_pneu, placa_veiculo, posicao, km_montagem, responsavel,
        data_montagem, desmontado, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *
    `;
    
    const mountingResult = await pool.query(mountingQuery, [
      idPneu, placaVeiculo, posicao, kmMontagem, responsavel,
      currentTime, false, currentTime, currentTime
    ]);
    
    // Update tire status to "Em uso"
    await pool.query(
      'UPDATE pneus_estoque SET status = $1, updated_at = $2 WHERE id = $3',
      ['Em uso', currentTime, idPneu]
    );
    
    res.status(201).json(mountingResult.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar montagem:', error);
    res.status(500).json({ message: `Erro ao criar montagem: ${error.message}` });
  }
});

// Dismount tire
router.put('/tire-mounting/:id/dismount', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { dataDesmontagem, kmDesmontagem, motivoDesmontagem } = req.body;
    
    if (!dataDesmontagem || !kmDesmontagem) {
      return res.status(400).json({ 
        message: 'Data e quilometragem de desmontagem são obrigatórias' 
      });
    }
    
    const currentTime = getCurrentUTC();
    
    // Get tire info before dismounting
    const mountingInfo = await pool.query(
      'SELECT id_pneu FROM pneus_montagens WHERE id = $1 AND desmontado = false',
      [id]
    );
    
    if (mountingInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Montagem não encontrada ou já desmontada' });
    }
    
    const tireId = mountingInfo.rows[0].id_pneu;
    
    // Update mounting record
    const updateQuery = `
      UPDATE pneus_montagens 
      SET desmontado = true, data_desmontagem = $1, km_desmontagem = $2, 
          motivo_desmontagem = $3, updated_at = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      dataDesmontagem, kmDesmontagem, motivoDesmontagem, currentTime, id
    ]);
    
    // Update tire status back to "Em estoque" or "Usado" based on condition
    const newStatus = motivoDesmontagem?.includes('descarte') ? 'Descartado' : 'Em estoque';
    await pool.query(
      'UPDATE pneus_estoque SET status = $1, updated_at = $2 WHERE id = $3',
      [newStatus, currentTime, tireId]
    );
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao desmontar pneu:', error);
    res.status(500).json({ message: `Erro ao desmontar pneu: ${error.message}` });
  }
});

// Get tire mounting history by tire ID
router.get('/tire-mounting/history/:tireId', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { tireId } = req.params;
    
    const query = `
      SELECT 
        tm.*, 
        te.dot, te.numero_serie, te.modelo, te.medida, te.marca
      FROM pneus_montagens tm
      JOIN pneus_estoque te ON tm.id_pneu = te.id
      WHERE tm.id_pneu = $1
      ORDER BY tm.data_montagem DESC
    `;
    
    const result = await pool.query(query, [tireId]);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao buscar histórico de montagens:', error);
    res.status(500).json({ message: `Erro ao buscar histórico: ${error.message}` });
  }
});

// Get vehicles with mounted tires
router.get('/tire-mounting/vehicles', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const query = `
      SELECT 
        tm.placa_veiculo,
        COUNT(*) as total_tires_mounted,
        array_agg(
          json_build_object(
            'id', tm.id,
            'posicao', tm.posicao,
            'dot', te.dot,
            'modelo', te.modelo,
            'medida', te.medida,
            'km_montagem', tm.km_montagem,
            'data_montagem', tm.data_montagem
          )
        ) as tires
      FROM pneus_montagens tm
      JOIN pneus_estoque te ON tm.id_pneu = te.id
      WHERE tm.desmontado = false
      GROUP BY tm.placa_veiculo
      ORDER BY tm.placa_veiculo
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao buscar veículos com pneus:', error);
    res.status(500).json({ message: `Erro ao buscar veículos: ${error.message}` });
  }
});

export default router;
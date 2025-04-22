import { Express } from 'express';
import { pool } from './db';

/**
 * Registra as rotas da API para gerenciamento de pneus
 */
export function registerPneusRoutes(app: Express) {
  // Rota para cadastrar novo pneu
  app.post('/api/pneus', async (req, res) => {
    try {
      const novoPneu = req.body;
      console.log('Recebendo requisição para cadastro de pneu:', novoPneu);
      
      // Validação básica
      if (!novoPneu.codigo || !novoPneu.marca || !novoPneu.modelo || !novoPneu.medida) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. Código, marca, modelo e medida são obrigatórios.'
        });
      }
      
      // Verificar se já existe um pneu com o mesmo código
      const checkQuery = 'SELECT COUNT(*) FROM pneus_completo WHERE codigo = $1';
      const checkResult = await pool.query(checkQuery, [novoPneu.codigo]);
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um pneu cadastrado com este código/serial.'
        });
      }
      
      // Inserir novo pneu
      const query = `
        INSERT INTO pneus_completo (
          codigo, marca, modelo, medida, aro, tipo, origem, data_aquisicao,
          veiculo_placa, posicao, km_inicial, km_atual, profundidade_sulco,
          localizacao, observacao, tire_number, change_date, change_km, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19
        ) RETURNING *
      `;
      
      const values = [
        novoPneu.codigo,
        novoPneu.marca,
        novoPneu.modelo,
        novoPneu.medida,
        novoPneu.aro || null,
        novoPneu.tipo || null,
        novoPneu.origem || 'novo',
        novoPneu.data_aquisicao ? new Date(novoPneu.data_aquisicao) : new Date(),
        novoPneu.veiculo_placa || null,
        novoPneu.posicao || null,
        novoPneu.km_inicial || 0,
        novoPneu.km_atual || 0,
        novoPneu.profundidade_sulco || 12.0,
        novoPneu.localizacao || 'almoxarifado',
        novoPneu.observacao || null,
        novoPneu.tire_number || novoPneu.codigo,
        novoPneu.change_date ? new Date(novoPneu.change_date) : null,
        novoPneu.change_km || 0,
        novoPneu.status || 'disponivel'
      ];
      
      const result = await pool.query(query, values);
      console.log('Pneu cadastrado com sucesso:', result.rows[0]);
      
      return res.status(201).json({
        success: true,
        message: 'Pneu cadastrado com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao cadastrar pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao cadastrar pneu',
        error: String(error)
      });
    }
  });
  
  // Rota para listar pneus
  app.get('/api/pneus', async (req, res) => {
    try {
      const { localizacao, status } = req.query;
      
      let query = 'SELECT * FROM pneus_completo';
      const values: any[] = [];
      let whereClause = '';
      
      if (localizacao) {
        whereClause = 'localizacao = $1';
        values.push(localizacao);
      }
      
      if (status) {
        if (whereClause) {
          whereClause += ' AND status = $' + (values.length + 1);
        } else {
          whereClause = 'status = $1';
        }
        values.push(status);
      }
      
      if (whereClause) {
        query += ' WHERE ' + whereClause;
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await pool.query(query, values);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao listar pneus:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar pneus',
        error: String(error)
      });
    }
  });
  
  // Rota para buscar pneu por ID
  app.get('/api/pneus/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = 'SELECT * FROM pneus_completo WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pneu não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao buscar pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar pneu',
        error: String(error)
      });
    }
  });
  
  // Rota para buscar pneu por código
  app.get('/api/pneus/codigo/:codigo', async (req, res) => {
    try {
      const { codigo } = req.params;
      
      const query = 'SELECT * FROM pneus_completo WHERE codigo = $1';
      const result = await pool.query(query, [codigo]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pneu não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao buscar pneu por código:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar pneu por código',
        error: String(error)
      });
    }
  });
  
  // Rota para atualizar pneu
  app.put('/api/pneus/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const pneuData = req.body;
      
      // Verificar se o pneu existe
      const checkQuery = 'SELECT * FROM pneus_completo WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pneu não encontrado'
        });
      }
      
      // Montar a query de atualização dinamicamente
      const fields = Object.keys(pneuData).filter(field => field !== 'id');
      const sets = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const query = `
        UPDATE pneus_completo 
        SET ${sets}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const values = [id, ...fields.map(field => pneuData[field])];
      
      const result = await pool.query(query, values);
      
      return res.status(200).json({
        success: true,
        message: 'Pneu atualizado com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar pneu',
        error: String(error)
      });
    }
  });
  
  // Rota para deletar pneu
  app.delete('/api/pneus/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se o pneu existe
      const checkQuery = 'SELECT * FROM pneus_completo WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pneu não encontrado'
        });
      }
      
      // Deletar o pneu
      const query = 'DELETE FROM pneus_completo WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      
      return res.status(200).json({
        success: true,
        message: 'Pneu deletado com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao deletar pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar pneu',
        error: String(error)
      });
    }
  });
}
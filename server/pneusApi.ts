import { Express } from 'express';
import { pool } from './db';

/**
 * Registra as rotas da API para gerenciamento de pneus
 */
export function registerPneusRoutes(app: Express) {
  // Rota para obter estatísticas de estoque (quantidade e valor total)
  app.get('/api/pneus/estatisticas/estoque', async (req, res) => {
    try {
      // Primeiro, obtemos a quantidade total de pneus em estoque
      const queryQuantidade = `
        SELECT 
          COUNT(*) as quantidade
        FROM pneus
        WHERE status = 'estoque'
      `;
      
      // Valor médio aproximado de um pneu para cálculo do valor total do estoque
      // Isso pode ser substituído por um valor mais preciso posteriormente
      const VALOR_MEDIO_PNEU = 1500.00; // R$ 1.500,00 por pneu
      
      const result = await pool.query(queryQuantidade);
      const quantidade = parseInt(result.rows[0].quantidade) || 0;
      const valorTotal = quantidade * VALOR_MEDIO_PNEU;
      
      return res.status(200).json({
        success: true,
        data: {
          quantidade: quantidade,
          valor_total: valorTotal
        }
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas de estoque de pneus:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas de estoque',
        error: String(error)
      });
    }
  });
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
      const checkQuery = 'SELECT COUNT(*) FROM pneus WHERE codigo = $1';
      const checkResult = await pool.query(checkQuery, [novoPneu.codigo]);
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um pneu cadastrado com este código/serial.'
        });
      }
      
      // Inserir novo pneu
      const query = `
        INSERT INTO pneus (
          codigo, marca, modelo, medida, aro, tipo, origem, data_aquisicao,
          veiculo_placa, posicao, km_inicial, km_atual, profundidade_sulco,
          localizacao, observacao, tire_number, change_date, change_km, status,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19,
          NOW(), NOW()
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
        UPDATE pneus 
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
      const query = 'DELETE FROM pneus WHERE id = $1 RETURNING *';
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
  
  // ========= API de Solicitações de Pneus =========
  
  // Listar solicitações de pneus
  app.get('/api/solicitacoes-pneus', async (req, res) => {
    try {
      const { base_id, status } = req.query;
      
      let query = 'SELECT * FROM solicitacoes_pneus';
      const values: any[] = [];
      let whereClause = '';
      
      if (base_id) {
        whereClause = 'base_id = $1';
        values.push(base_id);
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
      
      query += ' ORDER BY data_solicitacao DESC';
      
      const result = await pool.query(query, values);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao listar solicitações de pneus:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar solicitações de pneus',
        error: String(error)
      });
    }
  });
  
  // Criar solicitação de pneus
  app.post('/api/solicitacoes-pneus', async (req, res) => {
    try {
      const novaSolicitacao = req.body;
      
      // Validação básica
      if (!novaSolicitacao.base_id || !novaSolicitacao.marca || !novaSolicitacao.modelo || !novaSolicitacao.motivo) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. Base, marca, modelo e motivo são obrigatórios.'
        });
      }
      
      // Inserir nova solicitação
      const query = `
        INSERT INTO solicitacoes_pneus (
          base_id, base_nome, usuario_id, usuario_nome, marca, 
          modelo, medida, tipo, quantidade, motivo,
          status, data_solicitacao, observacoes,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, $8, $9, $10,
          $11, $12, $13,
          NOW(), NOW()
        ) RETURNING *
      `;
      
      const values = [
        novaSolicitacao.base_id,
        novaSolicitacao.base_nome,
        novaSolicitacao.usuario_id,
        novaSolicitacao.usuario_nome,
        novaSolicitacao.marca,
        novaSolicitacao.modelo,
        novaSolicitacao.medida,
        novaSolicitacao.tipo,
        novaSolicitacao.quantidade || 1,
        novaSolicitacao.motivo,
        'pendente',
        new Date(),
        novaSolicitacao.observacoes || null
      ];
      
      const result = await pool.query(query, values);
      
      return res.status(201).json({
        success: true,
        message: 'Solicitação registrada com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao criar solicitação de pneus:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar solicitação de pneus',
        error: String(error)
      });
    }
  });
  
  // Atualizar status de solicitação (aprovar/rejeitar)
  app.put('/api/solicitacoes-pneus/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, aprovador_id, aprovador_nome } = req.body;
      
      if (!['aprovado', 'rejeitado', 'pendente'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Os valores aceitos são: aprovado, rejeitado, pendente'
        });
      }
      
      // Verificar se a solicitação existe
      const checkQuery = 'SELECT * FROM solicitacoes_pneus WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }
      
      // Atualizar status
      let query;
      let values;
      
      if (status === 'aprovado' || status === 'rejeitado') {
        query = `
          UPDATE solicitacoes_pneus 
          SET status = $1, data_aprovacao = $2, aprovador_id = $3, aprovador_nome = $4, updated_at = NOW()
          WHERE id = $5
          RETURNING *
        `;
        values = [status, new Date(), aprovador_id, aprovador_nome, id];
      } else {
        query = `
          UPDATE solicitacoes_pneus 
          SET status = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        values = [status, id];
      }
      
      const result = await pool.query(query, values);
      
      return res.status(200).json({
        success: true,
        message: `Solicitação ${status === 'aprovado' ? 'aprovada' : (status === 'rejeitado' ? 'rejeitada' : 'atualizada')} com sucesso`,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar status da solicitação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status da solicitação',
        error: String(error)
      });
    }
  });
  
  // ========= API de Modelos de Pneus Pré-Cadastrados =========
  
  // Listar modelos de pneus
  app.get('/api/modelos-pneu', async (req, res) => {
    try {
      // Verificar se a tabela existe
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'modelos_pneu'
        )
      `;
      
      const tableExists = await pool.query(checkTableQuery);
      
      // Se a tabela não existir, criar
      if (!tableExists.rows[0].exists) {
        const createTableQuery = `
          CREATE TABLE modelos_pneu (
            id SERIAL PRIMARY KEY,
            marca VARCHAR(100) NOT NULL,
            modelo VARCHAR(100) NOT NULL,
            medida VARCHAR(50),
            valor_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            data_cadastro TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          
          -- Inserir alguns modelos iniciais de exemplo
          INSERT INTO modelos_pneu (marca, modelo, medida, valor_unitario) VALUES
          ('Pirelli', 'Scorpion ATR', '265/70 R16', 950.00),
          ('Michelin', 'Energy XM2+', '195/55 R16', 750.00),
          ('Goodyear', 'Efficient Grip', '205/55 R16', 680.00),
          ('Bridgestone', 'Ecopia EP150', '185/65 R15', 620.00),
          ('Continental', 'PowerContact 2', '175/70 R14', 520.00);
        `;
        
        await pool.query(createTableQuery);
        console.log('Tabela de modelos de pneus criada com dados iniciais');
      }
      
      // Consultar modelos de pneus
      const query = `
        SELECT id, marca, modelo, medida, valor_unitario, data_cadastro,
               created_at, updated_at, is_active
        FROM modelos_pneu
        WHERE is_active = true
        ORDER BY marca, modelo
      `;
      
      const result = await pool.query(query);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao listar modelos de pneus:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar modelos de pneus',
        error: String(error)
      });
    }
  });
  
  // Obter um modelo de pneu específico
  app.get('/api/modelos-pneu/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT id, marca, modelo, medida, valor_unitario, data_cadastro,
               created_at, updated_at, is_active
        FROM modelos_pneu
        WHERE id = $1 AND is_active = true
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Modelo de pneu não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao buscar modelo de pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar modelo de pneu',
        error: String(error)
      });
    }
  });
  
  // Adicionar um novo modelo de pneu
  app.post('/api/modelos-pneu', async (req, res) => {
    try {
      const { marca, modelo, medida, valor_unitario } = req.body;
      
      // Validação básica
      if (!marca || !modelo || !valor_unitario) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. Marca, modelo e valor unitário são obrigatórios.'
        });
      }
      
      // Verificar se já existe um modelo igual
      const checkQuery = `
        SELECT COUNT(*) FROM modelos_pneu 
        WHERE marca = $1 AND modelo = $2 AND medida = $3
      `;
      
      const checkResult = await pool.query(checkQuery, [marca, modelo, medida]);
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um modelo de pneu com estas especificações.'
        });
      }
      
      // Inserir novo modelo
      const query = `
        INSERT INTO modelos_pneu (marca, modelo, medida, valor_unitario, data_cadastro, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [marca, modelo, medida, valor_unitario]);
      
      return res.status(201).json({
        success: true,
        message: 'Modelo de pneu cadastrado com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao cadastrar modelo de pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao cadastrar modelo de pneu',
        error: String(error)
      });
    }
  });
  
  // Atualizar um modelo de pneu
  app.put('/api/modelos-pneu/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { marca, modelo, medida, valor_unitario, is_active } = req.body;
      
      // Verificar se o modelo existe
      const checkQuery = 'SELECT * FROM modelos_pneu WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Modelo de pneu não encontrado'
        });
      }
      
      // Construir query de atualização
      const updateFields = [];
      const values = [id];
      let paramIndex = 2;
      
      if (marca !== undefined) {
        updateFields.push(`marca = $${paramIndex++}`);
        values.push(marca);
      }
      
      if (modelo !== undefined) {
        updateFields.push(`modelo = $${paramIndex++}`);
        values.push(modelo);
      }
      
      if (medida !== undefined) {
        updateFields.push(`medida = $${paramIndex++}`);
        values.push(medida);
      }
      
      if (valor_unitario !== undefined) {
        updateFields.push(`valor_unitario = $${paramIndex++}`);
        values.push(valor_unitario);
      }
      
      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
      }
      
      updateFields.push(`updated_at = NOW()`);
      
      if (updateFields.length === 1) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar foi fornecido'
        });
      }
      
      const query = `
        UPDATE modelos_pneu
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      return res.status(200).json({
        success: true,
        message: 'Modelo de pneu atualizado com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar modelo de pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar modelo de pneu',
        error: String(error)
      });
    }
  });
  
  // Excluir um modelo de pneu (soft delete)
  app.delete('/api/modelos-pneu/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se o modelo existe
      const checkQuery = 'SELECT * FROM modelos_pneu WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Modelo de pneu não encontrado'
        });
      }
      
      // Fazer soft delete (marcar como inativo)
      const query = `
        UPDATE modelos_pneu
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [id]);
      
      return res.status(200).json({
        success: true,
        message: 'Modelo de pneu excluído com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao excluir modelo de pneu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir modelo de pneu',
        error: String(error)
      });
    }
  });
}
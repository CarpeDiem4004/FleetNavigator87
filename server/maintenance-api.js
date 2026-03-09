import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'maintenance_secret_key_2025';

// Middleware para autenticação JWT específica do sistema de manutenção
export function authenticateMaintenanceToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token inválido' });
    }
    req.maintenanceUser = user;
    next();
  });
}

// Login para oficinas (via CNPJ) e usuários internos
export async function loginMaintenance(req, res) {
  try {
    const { cnpj, email, password } = req.body;

    let user = null;
    let query = '';
    let params = [];

    if (cnpj) {
      // Login via CNPJ (oficina)
      query = `
        SELECT u.*, o.cnpj, o.razao_social, o.nome_fantasia 
        FROM usuarios_manutencao u
        JOIN oficinas_credenciadas o ON u.oficina_id = o.id
        WHERE o.cnpj = $1 AND u.is_active = true AND o.is_active = true
      `;
      params = [cnpj];
    } else if (email) {
      // Login via email (usuários internos)
      query = `
        SELECT u.*, o.cnpj, o.razao_social, o.nome_fantasia 
        FROM usuarios_manutencao u
        LEFT JOIN oficinas_credenciadas o ON u.oficina_id = o.id
        WHERE u.email = $1 AND u.is_active = true
      `;
      params = [email];
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'CNPJ ou email é obrigatório' 
      });
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciais inválidas' 
      });
    }

    user = result.rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciais inválidas' 
      });
    }

    // Atualizar último login
    await pool.query(
      'UPDATE usuarios_manutencao SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        oficina_id: user.oficina_id,
        cnpj: user.cnpj
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remover senha da resposta
    delete user.password;

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        oficina_id: user.oficina_id,
        cnpj: user.cnpj,
        razao_social: user.razao_social,
        nome_fantasia: user.nome_fantasia
      }
    });
  } catch (error) {
    console.error('Erro no login de manutenção:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
}

// Obter ordens de serviço (filtradas por oficina para usuários de oficina)
export async function getOrdensServico(req, res) {
  try {
    const { role, oficina_id } = req.maintenanceUser;
    const { status, veiculo_id, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 0;

    // Filtrar por oficina se for usuário de oficina
    if (role === 'oficina' && oficina_id) {
      whereClause += ` AND o.oficina_id = $${++paramCount}`;
      params.push(oficina_id);
    }

    // Filtrar por status se fornecido
    if (status) {
      whereClause += ` AND o.status = $${++paramCount}`;
      params.push(status);
    }

    // Filtrar por veículo se fornecido
    if (veiculo_id) {
      whereClause += ` AND o.veiculo_id = $${++paramCount}`;
      params.push(parseInt(veiculo_id));
    }

    const query = `
      SELECT 
        o.*,
        v.placa, v.marca, v.modelo, v.ano, v.tipo_veiculo,
        of.razao_social, of.nome_fantasia, of.cnpj,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM pecas_os WHERE ordem_servico_id = o.id) as total_pecas,
        (SELECT COUNT(*) FROM anexos_os WHERE ordem_servico_id = o.id) as total_anexos
      FROM ordens_servico o
      JOIN veiculos_manutencao v ON o.veiculo_id = v.id
      JOIN oficinas_credenciadas of ON o.oficina_id = of.id
      LEFT JOIN usuarios_manutencao u ON o.created_by = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar ordens de serviço' 
    });
  }
}

// Criar nova ordem de serviço (apenas usuários internos)
export async function createOrdemServico(req, res) {
  try {
    const { role, id: userId } = req.maintenanceUser;

    if (role === 'oficina') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado' 
      });
    }

    const {
      veiculo_id,
      oficina_id,
      tipo_manutencao,
      descricao_problema,
      km_veiculo,
      data_agendamento,
      observacoes_internas
    } = req.body;

    const query = `
      INSERT INTO ordens_servico (
        veiculo_id, oficina_id, tipo_manutencao, descricao_problema,
        km_veiculo, data_agendamento, observacoes_internas, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const params = [
      veiculo_id, oficina_id, tipo_manutencao, descricao_problema,
      km_veiculo, data_agendamento, observacoes_internas, userId
    ];

    const result = await pool.query(query, params);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar ordem de serviço' 
    });
  }
}

// Atualizar status da ordem de serviço
export async function updateStatusOrdemServico(req, res) {
  try {
    const { id } = req.params;
    const { status, observacoes_oficina, data_previsao_entrega, valor_mao_obra } = req.body;
    const { role, oficina_id } = req.maintenanceUser;

    // Verificar se o usuário tem permissão para atualizar esta OS
    let whereClause = 'WHERE id = $1';
    let params = [parseInt(id)];

    if (role === 'oficina') {
      whereClause += ' AND oficina_id = $2';
      params.push(oficina_id);
    }

    // Construir query de atualização dinamicamente
    let updateFields = [];
    let updateParams = [...params];
    let paramCount = params.length;

    if (status) {
      updateFields.push(`status = $${++paramCount}`);
      updateParams.push(status);

      // Definir data_inicio automaticamente quando status for alterado para 'em_execucao'
      if (status === 'em_execucao') {
        updateFields.push(`data_inicio = NOW()`);
      }
      
      // Definir data_finalizacao automaticamente quando status for 'finalizado'
      if (status === 'finalizado') {
        updateFields.push(`data_finalizacao = NOW()`);
      }
    }

    if (observacoes_oficina !== undefined) {
      updateFields.push(`observacoes_oficina = $${++paramCount}`);
      updateParams.push(observacoes_oficina);
    }

    if (data_previsao_entrega) {
      updateFields.push(`data_previsao_entrega = $${++paramCount}`);
      updateParams.push(data_previsao_entrega);
    }

    if (valor_mao_obra !== undefined) {
      updateFields.push(`valor_mao_obra = $${++paramCount}`);
      updateParams.push(parseFloat(valor_mao_obra));
    }

    updateFields.push('updated_at = NOW()');

    const updateQuery = `
      UPDATE ordens_servico 
      SET ${updateFields.join(', ')}
      ${whereClause}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ordem de serviço não encontrada ou sem permissão' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar ordem de serviço' 
    });
  }
}

// Obter peças de uma ordem de serviço
export async function getPecasOS(req, res) {
  try {
    const { ordem_servico_id } = req.params;
    const { role, oficina_id } = req.maintenanceUser;

    // Verificar se o usuário tem permissão para ver as peças desta OS
    if (role === 'oficina') {
      const osQuery = 'SELECT id FROM ordens_servico WHERE id = $1 AND oficina_id = $2';
      const osResult = await pool.query(osQuery, [parseInt(ordem_servico_id), oficina_id]);
      
      if (osResult.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          error: 'Acesso negado' 
        });
      }
    }

    const query = `
      SELECT * FROM pecas_os 
      WHERE ordem_servico_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [parseInt(ordem_servico_id)]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar peças:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar peças' 
    });
  }
}

// Adicionar peça à ordem de serviço
export async function addPecaOS(req, res) {
  try {
    const { ordem_servico_id } = req.params;
    const { nome_peca, codigo_peca, quantidade, valor_unitario, fornecedor } = req.body;
    const { role, oficina_id } = req.maintenanceUser;

    // Verificar se o usuário tem permissão para adicionar peças a esta OS
    if (role === 'oficina') {
      const osQuery = 'SELECT id FROM ordens_servico WHERE id = $1 AND oficina_id = $2';
      const osResult = await pool.query(osQuery, [parseInt(ordem_servico_id), oficina_id]);
      
      if (osResult.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          error: 'Acesso negado' 
        });
      }
    }

    const valor_total = parseFloat(quantidade) * parseFloat(valor_unitario);

    const query = `
      INSERT INTO pecas_os (
        ordem_servico_id, nome_peca, codigo_peca, quantidade, 
        valor_unitario, valor_total, fornecedor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const params = [
      parseInt(ordem_servico_id), nome_peca, codigo_peca, 
      parseInt(quantidade), parseFloat(valor_unitario), valor_total, fornecedor
    ];

    const result = await pool.query(query, params);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao adicionar peça:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao adicionar peça' 
    });
  }
}

// Obter veículos
export async function getVeiculos(req, res) {
  try {
    const { limit = 100, offset = 0, search } = req.query;

    let whereClause = 'WHERE is_active = true';
    let params = [];
    let paramCount = 0;

    if (search) {
      whereClause += ` AND (placa ILIKE $${++paramCount} OR marca ILIKE $${paramCount} OR modelo ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const query = `
      SELECT * FROM veiculos_manutencao 
      ${whereClause}
      ORDER BY placa ASC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao buscar veículos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar veículos' 
    });
  }
}

// Obter oficinas
export async function getOficinas(req, res) {
  try {
    const { role } = req.maintenanceUser;

    if (role === 'oficina') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado' 
      });
    }

    const query = `
      SELECT * FROM oficinas_credenciadas 
      WHERE is_active = true
      ORDER BY razao_social ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar oficinas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar oficinas' 
    });
  }
}

// Obter relatórios (apenas usuários internos)
export async function getRelatorios(req, res) {
  try {
    const { role } = req.maintenanceUser;

    if (role === 'oficina') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado' 
      });
    }

    const { tipo, data_inicio, data_fim } = req.query;

    let query = '';
    let params = [];

    switch (tipo) {
      case 'custos_por_oficina':
        query = `
          SELECT 
            o.razao_social,
            o.nome_fantasia,
            COUNT(os.id) as total_os,
            SUM(os.valor_total) as valor_total,
            AVG(os.valor_total) as valor_medio
          FROM oficinas_credenciadas o
          LEFT JOIN ordens_servico os ON o.id = os.oficina_id
          WHERE os.created_at BETWEEN $1 AND $2
          GROUP BY o.id, o.razao_social, o.nome_fantasia
          ORDER BY valor_total DESC
        `;
        params = [data_inicio || '2024-01-01', data_fim || '2024-12-31'];
        break;

      case 'custos_por_veiculo':
        query = `
          SELECT 
            v.placa,
            v.marca,
            v.modelo,
            COUNT(os.id) as total_os,
            SUM(os.valor_total) as valor_total,
            AVG(os.valor_total) as valor_medio
          FROM veiculos_manutencao v
          LEFT JOIN ordens_servico os ON v.id = os.veiculo_id
          WHERE os.created_at BETWEEN $1 AND $2
          GROUP BY v.id, v.placa, v.marca, v.modelo
          ORDER BY valor_total DESC
        `;
        params = [data_inicio || '2024-01-01', data_fim || '2024-12-31'];
        break;

      case 'status_os':
        query = `
          SELECT 
            status,
            COUNT(*) as quantidade,
            SUM(valor_total) as valor_total
          FROM ordens_servico
          WHERE created_at BETWEEN $1 AND $2
          GROUP BY status
          ORDER BY quantidade DESC
        `;
        params = [data_inicio || '2024-01-01', data_fim || '2024-12-31'];
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Tipo de relatório inválido' 
        });
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      tipo
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar relatório' 
    });
  }
}
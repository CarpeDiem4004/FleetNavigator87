import { Router } from 'express';
import { pool } from '../db';
import { isAuthenticated, isSessionAuthenticated } from '../middleware/auth/index';
import { format } from 'date-fns';

const router = Router();

// Lista todos os pneus com filtros opcionais
router.get('/pneus', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { marca, status, veiculo } = req.query;
    
    let queryParams = [];
    let whereConditions = [];
    let paramCount = 1;
    
    // Adicionar filtros se fornecidos
    if (marca) {
      whereConditions.push(`marca ILIKE $${paramCount}`);
      queryParams.push(`%${marca}%`);
      paramCount++;
    }
    
    if (status) {
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }
    
    if (veiculo) {
      whereConditions.push(`veiculo_placa ILIKE $${paramCount}`);
      queryParams.push(`%${veiculo}%`);
      paramCount++;
    }
    
    // Construir a query completa
    let query = `
      SELECT 
        id, 
        codigo, 
        marca, 
        modelo, 
        medida, 
        status, 
        veiculo_placa, 
        posicao, 
        km_atual, 
        profundidade_sulco, 
        localizacao,
        created_at
      FROM pneus_completo
    `;
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, queryParams);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar pneus:', error);
    res.status(500).json({ message: `Erro ao listar pneus: ${error.message}` });
  }
});

// Obtem um pneu específico pelo ID
router.get('/pneus/:id', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM pneus_completo WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pneu não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(`Erro ao buscar pneu ${req.params.id}:`, error);
    res.status(500).json({ message: `Erro ao buscar pneu: ${error.message}` });
  }
});

// Obtem estatísticas do estoque de pneus
router.get('/pneus-estatisticas', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_pneus,
        SUM(CASE WHEN status = 'disponivel' OR status = 'Disponível' THEN 1 ELSE 0 END) AS disponiveis,
        SUM(CASE WHEN status = 'em_uso' OR status = 'Em Uso' THEN 1 ELSE 0 END) AS em_uso,
        SUM(CASE WHEN status = 'descartado' OR status = 'Descartado' THEN 1 ELSE 0 END) AS descartados,
        COUNT(DISTINCT marca) AS total_marcas,
        COUNT(DISTINCT modelo) AS total_modelos,
        COUNT(DISTINCT medida) AS total_medidas,
        COALESCE(SUM(valor_unitario), 0) AS valor_total
      FROM pneus_completo
    `);
    
    // Se a tabela estiver vazia, retornar estatísticas zeradas
    if (!result.rows[0] || result.rows[0].total_pneus === '0') {
      return res.json({
        total_pneus: 0,
        disponiveis: 0,
        em_uso: 0,
        descartados: 0,
        total_marcas: 0,
        total_modelos: 0,
        total_medidas: 0,
        valor_total: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao obter estatísticas de pneus:', error);
    res.status(500).json({ message: `Erro ao obter estatísticas de pneus: ${error.message}` });
  }
});

// Adiciona um novo pneu
router.post('/pneus', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      codigo, 
      marca, 
      modelo, 
      medida, 
      aro,
      tipo,
      data_aquisicao, 
      profundidade_sulco,
      valor_unitario = 0,
      localizacao,
      observacao 
    } = req.body;
    
    // Validar dados obrigatórios
    if (!codigo || !marca || !modelo || !medida) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: código, marca, modelo e medida' 
      });
    }
    
    // Verificar se já existe pneu com este código
    const checkResult = await client.query(
      'SELECT id FROM pneus_completo WHERE codigo = $1',
      [codigo]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ 
        message: `Já existe um pneu com o código ${codigo}` 
      });
    }
    
    // Inserir o novo pneu
    const insertResult = await client.query(`
      INSERT INTO pneus_completo (
        codigo, 
        marca, 
        modelo, 
        medida, 
        aro,
        tipo,
        data_aquisicao,
        profundidade_sulco,
        valor_unitario,
        status,
        localizacao,
        observacao
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      codigo, 
      marca, 
      modelo, 
      medida, 
      aro || null,
      tipo || 'radial',
      data_aquisicao ? new Date(data_aquisicao) : new Date(),
      profundidade_sulco || 12.0, // Valor padrão para pneu novo em mm
      valor_unitario,
      'disponivel',
      localizacao || 'Estoque',
      observacao || ''
    ]);
    
    // Registrar atividade
    await client.query(`
      INSERT INTO pneus_atividades (
        pneu_id, 
        tipo_atividade, 
        data, 
        responsavel, 
        descricao
      )
      VALUES ($1, $2, $3, $4, $5)
    `, [
      insertResult.rows[0].id,
      'cadastro',
      new Date(),
      req.user?.name || 'Sistema',
      'Pneu cadastrado no sistema'
    ]);
    
    await client.query('COMMIT');
    
    res.status(201).json(insertResult.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Erro ao cadastrar pneu:', error);
    res.status(500).json({ message: `Erro ao cadastrar pneu: ${error.message}` });
  } finally {
    client.release();
  }
});

// Atualiza um pneu existente
router.put('/pneus/:id', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      marca, 
      modelo, 
      medida, 
      status,
      veiculo_placa,
      posicao,
      km_atual,
      profundidade_sulco,
      localizacao,
      observacao 
    } = req.body;
    
    // Verificar se o pneu existe
    const checkResult = await client.query(
      'SELECT * FROM pneus_completo WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pneu não encontrado' });
    }
    
    // Preparar os campos a serem atualizados
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (marca) {
      updates.push(`marca = $${paramCount}`);
      values.push(marca);
      paramCount++;
    }
    
    if (modelo) {
      updates.push(`modelo = $${paramCount}`);
      values.push(modelo);
      paramCount++;
    }
    
    if (medida) {
      updates.push(`medida = $${paramCount}`);
      values.push(medida);
      paramCount++;
    }
    
    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    
    if (veiculo_placa !== undefined) {
      updates.push(`veiculo_placa = $${paramCount}`);
      values.push(veiculo_placa || null);
      paramCount++;
    }
    
    if (posicao !== undefined) {
      updates.push(`posicao = $${paramCount}`);
      values.push(posicao || null);
      paramCount++;
    }
    
    if (km_atual) {
      updates.push(`km_atual = $${paramCount}`);
      values.push(km_atual);
      paramCount++;
    }
    
    if (profundidade_sulco) {
      updates.push(`profundidade_sulco = $${paramCount}`);
      values.push(profundidade_sulco);
      paramCount++;
    }
    
    if (localizacao) {
      updates.push(`localizacao = $${paramCount}`);
      values.push(localizacao);
      paramCount++;
    }
    
    if (observacao !== undefined) {
      updates.push(`observacao = $${paramCount}`);
      values.push(observacao);
      paramCount++;
    }
    
    // Adicionar updated_at
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;
    
    // Adicionar ID no final dos valores
    values.push(id);
    
    // Se não há nada para atualizar
    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }
    
    // Realizar a atualização
    const updateResult = await client.query(`
      UPDATE pneus_completo 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    // Registrar atividade
    await client.query(`
      INSERT INTO pneus_atividades (
        pneu_id, 
        tipo_atividade, 
        data, 
        responsavel, 
        descricao
      )
      VALUES ($1, $2, $3, $4, $5)
    `, [
      id,
      'atualizacao',
      new Date(),
      req.user?.name || 'Sistema',
      `Dados do pneu atualizados`
    ]);
    
    await client.query('COMMIT');
    
    res.json(updateResult.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Erro ao atualizar pneu ${req.params.id}:`, error);
    res.status(500).json({ message: `Erro ao atualizar pneu: ${error.message}` });
  } finally {
    client.release();
  }
});

// Registra movimentação de pneu
router.post('/pneus/:id/movimentacao', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      tipo_movimentacao, 
      km, 
      motivo,
      veiculo_placa,
      posicao,
      local,
      responsavel,
      observacoes
    } = req.body;
    
    // Validar dados obrigatórios
    if (!tipo_movimentacao || !km) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: tipo_movimentacao e km' 
      });
    }
    
    // Verificar se o pneu existe
    const pneuResult = await client.query(
      'SELECT * FROM pneus_completo WHERE id = $1',
      [id]
    );
    
    if (pneuResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pneu não encontrado' });
    }
    
    // Inserir a movimentação
    const movResult = await client.query(`
      INSERT INTO movimentacao_pneu (
        id_pneu,
        tipo_movimentacao,
        km,
        data,
        motivo,
        id_veiculo,
        local,
        responsavel
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      id,
      tipo_movimentacao,
      km,
      new Date(),
      motivo || null,
      veiculo_placa || null,
      local || 'Garagem',
      responsavel || req.user?.name || 'Sistema'
    ]);
    
    // Atualizar o status e informações do pneu conforme o tipo de movimentação
    let novoStatus;
    const atualizacoes = [];
    const valores = [id];
    let paramIndex = 2;
    
    if (tipo_movimentacao === 'montagem') {
      novoStatus = 'em_uso';
      
      if (veiculo_placa) {
        atualizacoes.push(`veiculo_placa = $${paramIndex}`);
        valores.push(veiculo_placa);
        paramIndex++;
      }
      
      if (posicao) {
        atualizacoes.push(`posicao = $${paramIndex}`);
        valores.push(posicao);
        paramIndex++;
      }
      
      // Atualizar km atual
      atualizacoes.push(`km_atual = $${paramIndex}`);
      valores.push(km);
      paramIndex++;
    } 
    else if (tipo_movimentacao === 'desmontagem') {
      novoStatus = 'disponivel';
      
      // Limpar veiculo e posição
      atualizacoes.push(`veiculo_placa = NULL, posicao = NULL`);
    }
    else if (tipo_movimentacao === 'descarte') {
      novoStatus = 'descartado';
    }
    
    if (novoStatus) {
      atualizacoes.push(`status = $${paramIndex}`);
      valores.push(novoStatus);
      paramIndex++;
    }
    
    // Atualizar o pneu se houver mudanças
    if (atualizacoes.length > 0) {
      await client.query(`
        UPDATE pneus_completo 
        SET ${atualizacoes.join(', ')}, updated_at = NOW() 
        WHERE id = $1
      `, valores);
    }
    
    // Registrar na tabela de atividades
    await client.query(`
      INSERT INTO pneus_atividades (
        pneu_id, 
        tipo_atividade, 
        data, 
        responsavel, 
        descricao,
        km_veiculo
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      id,
      tipo_movimentacao,
      new Date(),
      responsavel || req.user?.name || 'Sistema',
      observacoes || `${tipo_movimentacao.charAt(0).toUpperCase() + tipo_movimentacao.slice(1)} do pneu`,
      km
    ]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: `Movimentação de ${tipo_movimentacao} registrada com sucesso`,
      movimentacao: movResult.rows[0]
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Erro ao registrar movimentação do pneu ${req.params.id}:`, error);
    res.status(500).json({ message: `Erro ao registrar movimentação: ${error.message}` });
  } finally {
    client.release();
  }
});

// Obtem histórico de um pneu
router.get('/pneus/:id/historico', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        a.id,
        a.tipo_atividade,
        a.data,
        a.responsavel,
        a.descricao,
        a.km_veiculo,
        a.profundidade_sulco_antes,
        a.profundidade_sulco_depois,
        a.localizacao
      FROM pneus_atividades a
      WHERE a.pneu_id = $1
      ORDER BY a.data DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error(`Erro ao buscar histórico do pneu ${req.params.id}:`, error);
    res.status(500).json({ message: `Erro ao buscar histórico: ${error.message}` });
  }
});

// Busca modelos de pneus para o catálogo
router.get('/modelos-pneu', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  try {
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'modelos_pneu'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Criar a tabela se não existir
      await pool.query(`
        CREATE TABLE IF NOT EXISTS modelos_pneu (
          id SERIAL PRIMARY KEY,
          marca VARCHAR(50) NOT NULL,
          modelo VARCHAR(50) NOT NULL,
          medida VARCHAR(50) NOT NULL,
          aro VARCHAR(20),
          tipo VARCHAR(20) DEFAULT 'radial',
          vida_util_km INTEGER,
          profundidade_sulco_nova NUMERIC(4,1) DEFAULT 12.0,
          profundidade_sulco_minima NUMERIC(4,1) DEFAULT 1.6,
          valor_unitario NUMERIC(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Inserir alguns modelos iniciais
        INSERT INTO modelos_pneu (marca, modelo, medida, aro, valor_unitario)
        VALUES
          ('Pirelli', 'Scorpion ATR', '265/70 R16', '16', 950.00),
          ('Michelin', 'Energy XM2+', '195/55 R16', '16', 750.00),
          ('Goodyear', 'Efficient Grip', '205/55 R16', '16', 680.00),
          ('Bridgestone', 'Ecopia EP150', '185/65 R15', '15', 620.00),
          ('Continental', 'PowerContact 2', '175/70 R14', '14', 520.00);
      `);
      
      console.log('Tabela modelos_pneu criada com modelos iniciais');
    }
    
    // Buscar todos os modelos
    const result = await pool.query(`
      SELECT 
        id, marca, modelo, medida, aro, tipo, 
        vida_util_km, profundidade_sulco_nova, profundidade_sulco_minima,
        valor_unitario, created_at, updated_at
      FROM modelos_pneu
      ORDER BY marca, modelo
    `);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao buscar modelos de pneu:', error);
    res.status(500).json({ message: `Erro ao buscar modelos de pneu: ${error.message}` });
  }
});

// Criar a tabela de pneus se não existir
router.get('/criar-tabela-pneus', isAuthenticated, isSessionAuthenticated, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar se a tabela já existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pneus_completo'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Criar a tabela principal de pneus
      await client.query(`
        CREATE TABLE IF NOT EXISTS pneus_completo (
          id SERIAL PRIMARY KEY,
          codigo VARCHAR(50) UNIQUE NOT NULL,
          marca VARCHAR(50) NOT NULL,
          modelo VARCHAR(50) NOT NULL,
          medida VARCHAR(50) NOT NULL,
          aro VARCHAR(20),
          tipo VARCHAR(20) DEFAULT 'radial',
          origem VARCHAR(20) DEFAULT 'compra',
          data_aquisicao DATE DEFAULT CURRENT_DATE,
          veiculo_placa VARCHAR(10),
          posicao VARCHAR(20),
          km_inicial INTEGER DEFAULT 0,
          km_atual INTEGER DEFAULT 0,
          profundidade_sulco NUMERIC(4,1) DEFAULT 12.0,
          status VARCHAR(20) DEFAULT 'disponivel',
          localizacao VARCHAR(50) DEFAULT 'Estoque',
          valor_unitario NUMERIC(10,2) DEFAULT 0,
          observacao TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Criar tabela de movimentações
        CREATE TABLE IF NOT EXISTS movimentacao_pneu (
          id SERIAL PRIMARY KEY,
          id_pneu INTEGER NOT NULL REFERENCES pneus_completo(id),
          tipo_movimentacao VARCHAR(20) NOT NULL,
          km INTEGER NOT NULL,
          data TIMESTAMP DEFAULT NOW(),
          motivo VARCHAR(100),
          id_veiculo VARCHAR(10),
          local VARCHAR(50),
          responsavel VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Criar tabela de atividades
        CREATE TABLE IF NOT EXISTS pneus_atividades (
          id SERIAL PRIMARY KEY,
          pneu_id INTEGER NOT NULL REFERENCES pneus_completo(id),
          tipo_atividade VARCHAR(50) NOT NULL,
          data TIMESTAMP DEFAULT NOW(),
          responsavel VARCHAR(100),
          descricao TEXT,
          km_veiculo INTEGER,
          profundidade_sulco_antes NUMERIC(4,1),
          profundidade_sulco_depois NUMERIC(4,1),
          localizacao VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Criar índices para melhorar performance
        CREATE INDEX IF NOT EXISTS idx_pneus_completo_codigo ON pneus_completo(codigo);
        CREATE INDEX IF NOT EXISTS idx_pneus_completo_status ON pneus_completo(status);
        CREATE INDEX IF NOT EXISTS idx_pneus_completo_veiculo ON pneus_completo(veiculo_placa);
        CREATE INDEX IF NOT EXISTS idx_movimentacao_pneu_id ON movimentacao_pneu(id_pneu);
        CREATE INDEX IF NOT EXISTS idx_pneus_atividades_pneu_id ON pneus_atividades(pneu_id);
      `);
      
      // Inserir alguns pneus de exemplo
      await client.query(`
        INSERT INTO pneus_completo 
          (codigo, marca, modelo, medida, aro, status, valor_unitario, localizacao) 
        VALUES
          ('P001', 'Pirelli', 'Scorpion ATR', '265/70 R16', '16', 'disponivel', 950.00, 'Estoque Principal'),
          ('P002', 'Michelin', 'Energy XM2+', '195/55 R16', '16', 'disponivel', 750.00, 'Estoque Principal'),
          ('P003', 'Goodyear', 'Efficient Grip', '205/55 R16', '16', 'disponivel', 680.00, 'Estoque Principal'),
          ('P004', 'Pirelli', 'Scorpion ATR', '265/70 R16', '16', 'em_uso', 950.00, 'Veículo'),
          ('P005', 'Continental', 'PowerContact 2', '175/70 R14', '14', 'em_uso', 520.00, 'Veículo')
      `);
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Tabelas de pneus criadas com sucesso com dados iniciais' 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Tabelas de pneus já existem no banco de dados' 
      });
    }
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar tabelas de pneus:', error);
    res.status(500).json({ 
      success: false, 
      message: `Erro ao criar tabelas de pneus: ${error.message}` 
    });
  } finally {
    client.release();
  }
});

export default router;
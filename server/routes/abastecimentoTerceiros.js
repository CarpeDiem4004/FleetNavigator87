const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const router = express.Router();

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/notas-fiscais';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'nf-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  }
});

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'murici_terceiros_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

// Rota de login via CNPJ
router.post('/login', async (req, res) => {
  try {
    const { cnpj, senha } = req.body;

    if (!cnpj || !senha) {
      return res.status(400).json({ error: 'CNPJ e senha são obrigatórios' });
    }

    // Buscar usuário pelo CNPJ
    const userQuery = `
      SELECT u.*, e.nome as empresa_nome, e.id as empresa_id
      FROM usuarios_terceiros u
      JOIN empresas_terceiras e ON u.empresa_id = e.id
      WHERE u.cnpj = $1 AND u.is_active = true
    `;
    
    const userResult = await pool.query(userQuery, [cnpj]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'CNPJ não encontrado ou inativo' });
    }

    const user = userResult.rows[0];

    // Verificar senha (por enquanto comparação simples, depois implementar bcrypt)
    if (senha !== '123456') {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Atualizar último login
    await pool.query(
      'UPDATE usuarios_terceiros SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Gerar JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        empresaId: user.empresa_id,
        cnpj: user.cnpj,
        empresaNome: user.empresa_nome
      },
      process.env.JWT_SECRET || 'murici_terceiros_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        cnpj: user.cnpj,
        empresaId: user.empresa_id,
        empresaNome: user.empresa_nome
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para verificar token e obter dados do usuário
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userQuery = `
      SELECT u.*, e.nome as empresa_nome
      FROM usuarios_terceiros u
      JOIN empresas_terceiras e ON u.empresa_id = e.id
      WHERE u.id = $1
    `;
    
    const userResult = await pool.query(userQuery, [req.user.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userResult.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        cnpj: user.cnpj,
        empresaId: user.empresa_id,
        empresaNome: user.empresa_nome
      }
    });

  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter dashboard da empresa
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const empresaId = req.user.empresaId;

    // Buscar estatísticas da empresa
    const statsQuery = `
      SELECT 
        COUNT(*) as total_abastecimentos,
        COALESCE(SUM(litros), 0) as total_litros,
        COALESCE(SUM(valor), 0) as total_valor
      FROM abastecimentos_terceiros 
      WHERE empresa_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [empresaId]);
    const stats = statsResult.rows[0];

    // Buscar últimos abastecimentos
    const abastecimentosQuery = `
      SELECT 
        id,
        motorista_nome,
        veiculo_placa,
        litros,
        valor,
        nota_fiscal_url,
        data_abastecimento,
        observacoes
      FROM abastecimentos_terceiros 
      WHERE empresa_id = $1
      ORDER BY data_abastecimento DESC
      LIMIT 20
    `;
    
    const abastecimentosResult = await pool.query(abastecimentosQuery, [empresaId]);

    res.json({
      success: true,
      data: {
        empresa: {
          nome: req.user.empresaNome,
          cnpj: req.user.cnpj
        },
        estatisticas: {
          totalAbastecimentos: parseInt(stats.total_abastecimentos),
          totalLitros: parseFloat(stats.total_litros),
          totalValor: parseFloat(stats.total_valor)
        },
        abastecimentos: abastecimentosResult.rows
      }
    });

  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar novo abastecimento
router.post('/abastecimentos', verifyToken, upload.single('notaFiscal'), async (req, res) => {
  try {
    const { motoristaNome, veiculoPlaca, litros, valor, observacoes } = req.body;
    const empresaId = req.user.empresaId;

    if (!motoristaNome || !veiculoPlaca || !litros || !valor) {
      return res.status(400).json({ 
        error: 'Nome do motorista, placa do veículo, litros e valor são obrigatórios' 
      });
    }

    const notaFiscalUrl = req.file ? `/uploads/notas-fiscais/${req.file.filename}` : null;

    const insertQuery = `
      INSERT INTO abastecimentos_terceiros 
      (empresa_id, motorista_nome, veiculo_placa, litros, valor, nota_fiscal_url, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      empresaId,
      motoristaNome,
      veiculoPlaca,
      parseFloat(litros),
      parseFloat(valor),
      notaFiscalUrl,
      observacoes || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Abastecimento registrado com sucesso',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar abastecimento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar abastecimentos com filtros
router.get('/abastecimentos', verifyToken, async (req, res) => {
  try {
    const empresaId = req.user.empresaId;
    const { page = 1, limit = 10, dataInicio, dataFim, motorista, placa } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['empresa_id = $1'];
    let queryParams = [empresaId];
    let paramCount = 1;

    if (dataInicio) {
      paramCount++;
      whereConditions.push(`data_abastecimento >= $${paramCount}`);
      queryParams.push(dataInicio);
    }

    if (dataFim) {
      paramCount++;
      whereConditions.push(`data_abastecimento <= $${paramCount}`);
      queryParams.push(dataFim);
    }

    if (motorista) {
      paramCount++;
      whereConditions.push(`motorista_nome ILIKE $${paramCount}`);
      queryParams.push(`%${motorista}%`);
    }

    if (placa) {
      paramCount++;
      whereConditions.push(`veiculo_placa ILIKE $${paramCount}`);
      queryParams.push(`%${placa}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) FROM abastecimentos_terceiros WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT * FROM abastecimentos_terceiros 
      WHERE ${whereClause}
      ORDER BY data_abastecimento DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    queryParams.push(limit, offset);

    const dataResult = await pool.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar abastecimentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para exportar relatório (CSV)
router.get('/relatorio/export', verifyToken, async (req, res) => {
  try {
    const empresaId = req.user.empresaId;
    const { dataInicio, dataFim } = req.query;

    let whereConditions = ['empresa_id = $1'];
    let queryParams = [empresaId];
    let paramCount = 1;

    if (dataInicio) {
      paramCount++;
      whereConditions.push(`data_abastecimento >= $${paramCount}`);
      queryParams.push(dataInicio);
    }

    if (dataFim) {
      paramCount++;
      whereConditions.push(`data_abastecimento <= $${paramCount}`);
      queryParams.push(dataFim);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        TO_CHAR(data_abastecimento, 'DD/MM/YYYY HH24:MI') as data,
        motorista_nome,
        veiculo_placa,
        litros,
        valor,
        CASE WHEN nota_fiscal_url IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_nota
      FROM abastecimentos_terceiros 
      WHERE ${whereClause}
      ORDER BY data_abastecimento DESC
    `;

    const result = await pool.query(query, queryParams);

    // Gerar CSV
    const csvHeader = 'Data,Motorista,Placa,Litros,Valor,Nota Fiscal\n';
    const csvData = result.rows.map(row => 
      `${row.data},"${row.motorista_nome}",${row.veiculo_placa},${row.litros},${row.valor},${row.tem_nota}`
    ).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_abastecimentos_${Date.now()}.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
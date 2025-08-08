import { Router } from 'express';
import { Pool } from 'pg';
import jsonwebtoken from 'jsonwebtoken';

// Configurar conexão PostgreSQL direta
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('[LINE-HALL] Usando conexão PostgreSQL direta para acesso aos dados locais');

const router = Router();

console.log('[LINE-HALL] Iniciando configuração das rotas do Line Hall');

// Rota de teste
router.get('/teste', (req, res) => {
  console.log('[LINE-HALL] Rota de teste acessada');
  res.json({ success: true, message: 'Line Hall API funcionando!' });
});

// Login do motorista Line Hall
router.post('/motorista/login', async (req, res) => {
  console.log('[LINE-HALL] Tentativa de login recebida:', req.body);
  try {
    const { cpf } = req.body;

    if (!cpf) {
      return res.status(400).json({ 
        success: false, 
        message: 'CPF é obrigatório' 
      });
    }

    // Buscar motorista pelo CPF na tabela motoristas (tentando diferentes formatos)
    console.log('[LINE-HALL] Buscando motorista com CPF:', cpf);
    
    // Remover máscara do CPF fornecido
    const cpfLimpo = cpf.replace(/\D/g, '');
    console.log('[LINE-HALL] CPF sem máscara:', cpfLimpo);
    
    // Formatar CPF com máscara
    const cpfComMascara = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    console.log('[LINE-HALL] CPF com máscara:', cpfComMascara);
    
    console.log('[LINE-HALL] Testando formatos - Original:', cpf, 'Limpo:', cpfLimpo, 'Com máscara:', cpfComMascara);

    // Buscar motorista diretamente no PostgreSQL
    console.log('[LINE-HALL] Buscando motorista no PostgreSQL local');
    
    const query = `
      SELECT id, nome, cpf, base_id, created_at
      FROM motoristas 
      WHERE cpf = $1 OR cpf = $2 OR cpf = $3
      LIMIT 1
    `;
    
    const result = await pool.query(query, [cpf, cpfLimpo, cpfComMascara]);
    const motorista = result.rows;

    console.log('[LINE-HALL] Resultado da busca PostgreSQL:', { 
      totalEncontrados: motorista.length,
      motorista: motorista.length > 0 ? motorista[0] : null 
    });

    if (motorista.length === 0) {
      console.log('[LINE-HALL] Motorista não encontrado para CPF:', cpf);
      return res.status(404).json({ 
        success: false, 
        message: 'Motorista não encontrado. Verifique o CPF informado.' 
      });
    }

    const motoristaData = motorista[0];

    // Atualizar último login no PostgreSQL
    const updateQuery = 'UPDATE motoristas SET updated_at = NOW() WHERE id = $1';
    await pool.query(updateQuery, [motoristaData.id]);

    console.log('[LINE-HALL] Login realizado com sucesso para motorista:', motoristaData.nome);

    // Gerar token JWT para o motorista
    const token = jsonwebtoken.sign(
      {
        motoristaId: motoristaData.id,
        cpf: motoristaData.cpf,
        nome: motoristaData.nome,
        type: 'line-hall-driver'
      },
      process.env.JWT_SECRET || 'murici_line_hall_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      message: 'Login realizado com sucesso',
      motorista: {
        id: motoristaData.id,
        nome: motoristaData.nome,
        cpf: motoristaData.cpf,
        telefone: motoristaData.telefone,
        base_id: motoristaData.base_id
      }
    });

  } catch (error) {
    console.error('Erro no login do motorista:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Obter viagens do motorista
router.get('/motorista/:id/viagens', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM line_hall_shopee WHERE motorista_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [id]);
    const viagens = result.rows;

    res.json({
      success: true,
      viagens
    });

  } catch (error) {
    console.error('Erro ao buscar viagens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Criar nova viagem
router.post('/viagem', async (req, res) => {
  try {
    const {
      placa_cavalo,
      placa_carreta_1,
      placa_carreta_2,
      motorista_id,
      motorista_nome,
      local_carregamento,
      local_descarregamento,
      horario_carregamento,
      status_viagem,
      observacoes
    } = req.body;

    const insertQuery = `
      INSERT INTO line_hall_shopee (
        placa_cavalo, placa_carreta_1, placa_carreta_2,
        motorista_id, motorista_nome, local_carregamento,
        local_descarregamento, horario_carregamento,
        status_viagem, observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      placa_cavalo, placa_carreta_1, placa_carreta_2,
      motorista_id, motorista_nome, local_carregamento,
      local_descarregamento, horario_carregamento,
      status_viagem, observacoes
    ]);
    
    const viagem = result.rows[0];

    res.json({
      success: true,
      viagem
    });

  } catch (error) {
    console.error('Erro ao criar viagem:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

export default router;
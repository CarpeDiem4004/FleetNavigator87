import { Request, Response, Router } from 'express';
import { pool } from '../db';

const router = Router();

// Rota para verificar se a tabela preco_combustivel existe e criar se necessário
router.get('/verificar-tabela', async (req, res) => {
  try {
    // Verificar se a tabela preco_combustivel existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'preco_combustivel'
      );
    `;
    const tableExists = await pool.query(checkTableQuery);
    
    if (!tableExists.rows[0].exists) {
      // Se a tabela não existir, vamos criá-la
      const createTableQuery = `
        CREATE TABLE preco_combustivel (
          id SERIAL PRIMARY KEY,
          tipo VARCHAR(50) NOT NULL,
          preco NUMERIC NOT NULL,
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Inserir valores padrão
        INSERT INTO preco_combustivel (tipo, preco) VALUES 
        ('Diesel', 5.99),
        ('Gasolina', 6.29),
        ('Etanol', 4.89),
        ('Arla 32', 7.50);
      `;
      await pool.query(createTableQuery);
      
      return res.json({
        success: true,
        message: 'Tabela preco_combustivel criada com sucesso e dados padrão inseridos',
        created: true
      });
    }
    
    return res.json({
      success: true,
      message: 'Tabela preco_combustivel já existe',
      created: false
    });
  } catch (error) {
    console.error('Erro ao verificar ou criar tabela preco_combustivel:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar ou criar tabela',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Buscar preço atual de um tipo de combustível
router.get('/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    
    // Verificar se a tabela existe
    try {
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'preco_combustivel'
        );
      `;
      const tableExists = await pool.query(checkTableQuery);
      
      if (!tableExists.rows[0].exists) {
        // Criar tabela se não existir
        const createTableQuery = `
          CREATE TABLE preco_combustivel (
            id SERIAL PRIMARY KEY,
            tipo VARCHAR(50) NOT NULL,
            preco NUMERIC NOT NULL,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Inserir valores padrão
          INSERT INTO preco_combustivel (tipo, preco) VALUES 
          ('Diesel', 5.99),
          ('Gasolina', 6.29),
          ('Etanol', 4.89),
          ('Arla 32', 7.50);
        `;
        await pool.query(createTableQuery);
      }
    } catch (error) {
      console.error('Erro ao verificar ou criar tabela preco_combustivel:', error);
    }
    
    // Buscar preço do combustível
    const query = `
      SELECT * FROM preco_combustivel
      WHERE tipo = $1 AND ativo = TRUE
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [tipo]);
    
    if (result.rows.length === 0) {
      // Caso não exista o preço para o tipo solicitado, criar um valor padrão
      let precoDefault = 5.99; // Valor padrão para Diesel
      
      if (tipo.toLowerCase().includes('gasol')) {
        precoDefault = 6.29;
      } else if (tipo.toLowerCase().includes('etanol')) {
        precoDefault = 4.89;
      } else if (tipo.toLowerCase().includes('arla')) {
        precoDefault = 7.50;
      }
      
      const insertQuery = `
        INSERT INTO preco_combustivel (tipo, preco)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, [tipo, precoDefault]);
      
      return res.json({
        success: true,
        data: insertResult.rows[0],
        message: `Preço padrão criado para ${tipo}`
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao buscar preço para combustível ${req.params.tipo}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar preço do combustível',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Atualizar preço de um combustível
router.post('/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    const { preco } = req.body;
    
    if (!preco || isNaN(parseFloat(preco))) {
      return res.status(400).json({
        success: false,
        message: 'Preço inválido'
      });
    }
    
    // Desativar preços anteriores
    await pool.query(`
      UPDATE preco_combustivel
      SET ativo = FALSE
      WHERE tipo = $1 AND ativo = TRUE
    `, [tipo]);
    
    // Inserir novo preço
    const query = `
      INSERT INTO preco_combustivel (tipo, preco)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await pool.query(query, [tipo, parseFloat(preco)]);
    
    return res.json({
      success: true,
      data: result.rows[0],
      message: `Preço atualizado para ${tipo}`
    });
  } catch (error) {
    console.error(`Erro ao atualizar preço para combustível ${req.params.tipo}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar preço do combustível',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Listar todos os preços de combustíveis ativos
router.get('/', async (req, res) => {
  try {
    // Verificar se a tabela existe
    try {
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'preco_combustivel'
        );
      `;
      const tableExists = await pool.query(checkTableQuery);
      
      if (!tableExists.rows[0].exists) {
        // Criar tabela se não existir
        const createTableQuery = `
          CREATE TABLE preco_combustivel (
            id SERIAL PRIMARY KEY,
            tipo VARCHAR(50) NOT NULL,
            preco NUMERIC NOT NULL,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Inserir valores padrão
          INSERT INTO preco_combustivel (tipo, preco) VALUES 
          ('Diesel', 5.99),
          ('Gasolina', 6.29),
          ('Etanol', 4.89),
          ('Arla 32', 7.50);
        `;
        await pool.query(createTableQuery);
      }
    } catch (error) {
      console.error('Erro ao verificar ou criar tabela preco_combustivel:', error);
    }
    
    // Buscar todos os preços ativos
    const query = `
      SELECT DISTINCT ON (tipo) *
      FROM preco_combustivel
      WHERE ativo = TRUE
      ORDER BY tipo, updated_at DESC
    `;
    
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar preços de combustíveis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar preços de combustíveis',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
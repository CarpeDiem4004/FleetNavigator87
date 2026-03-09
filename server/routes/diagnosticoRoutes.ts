/**
 * Rotas de diagnóstico para o projeto Sistema de Gestão de Frotas
 * 
 * Estas rotas fornecem funcionalidades para teste e diagnóstico do sistema,
 * incluindo verificação de conexão, criação de tabelas de demonstração e
 * salvamento/recuperação de dados de formulários de demonstração.
 */
import { Router } from 'express';
import { pool } from '../db';

// Criar router para diagnóstico
const router = Router();

/**
 * Rota para criar uma tabela de demonstração
 * Esta tabela é usada para testar o salvamento automático e sincronização
 */
router.post('/create-demo-table', async (req, res) => {
  try {
    // Verificar se a tabela já existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'demo_forms'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (tableExists) {
      return res.json({
        success: true,
        message: 'A tabela demo_forms já existe',
        action: 'none'
      });
    }
    
    // Criar a tabela
    await pool.query(`
      CREATE TABLE IF NOT EXISTS demo_forms (
        id SERIAL PRIMARY KEY,
        form_title TEXT,
        form_data JSONB,
        status TEXT DEFAULT 'rascunho',
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Adicionar comentário à tabela para documentação
    await pool.query(`
      COMMENT ON TABLE demo_forms IS 'Tabela de demonstração para teste de sincronização e salvamento automático';
    `);
    
    // Adicionar índice para melhorar performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS demo_forms_created_at_idx ON demo_forms (created_at DESC);
    `);
    
    return res.json({
      success: true,
      message: 'Tabela de demonstração criada com sucesso',
      action: 'created'
    });
  } catch (error) {
    console.error('Erro ao criar tabela de demonstração:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar tabela de demonstração',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter registros de demonstração
 */
router.get('/demo-forms', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM demo_forms
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    return res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao obter registros de demonstração:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter registros de demonstração',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para salvar um registro de demonstração
 */
router.post('/demo-forms', async (req, res) => {
  try {
    const { form_title, form_data, created_by, status } = req.body;
    
    if (!form_data) {
      return res.status(400).json({
        success: false,
        message: 'Dados do formulário são obrigatórios'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO demo_forms (form_title, form_data, created_by, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        form_title || 'Formulário de Demonstração',
        JSON.stringify(form_data),
        created_by || 'usuário anônimo',
        status || 'rascunho'
      ]
    );
    
    return res.json({
      success: true,
      message: 'Registro salvo com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao salvar registro de demonstração:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao salvar registro',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para atualizar um registro de demonstração
 */
router.put('/demo-forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { form_title, form_data, status } = req.body;
    
    if (!form_data) {
      return res.status(400).json({
        success: false,
        message: 'Dados do formulário são obrigatórios'
      });
    }
    
    const result = await pool.query(
      `UPDATE demo_forms
       SET form_title = $1,
           form_data = $2,
           status = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        form_title || 'Formulário de Demonstração',
        JSON.stringify(form_data),
        status || 'rascunho',
        id
      ]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro não encontrado'
      });
    }
    
    return res.json({
      success: true,
      message: 'Registro atualizado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar registro de demonstração:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar registro',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para excluir um registro de demonstração
 */
router.delete('/demo-forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM demo_forms WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro não encontrado'
      });
    }
    
    return res.json({
      success: true,
      message: 'Registro excluído com sucesso',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Erro ao excluir registro de demonstração:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir registro',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para verificar o status da conexão com o banco de dados
 */
router.get('/health-check', async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await pool.query('SELECT NOW() as time');
    const endTime = Date.now();
    
    return res.json({
      success: true,
      message: 'Conexão com o banco de dados está funcionando',
      database: {
        time: result.rows[0].time,
        latency: endTime - startTime
      }
    });
  } catch (error) {
    console.error('Erro ao verificar conexão com o banco de dados:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao conectar ao banco de dados',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
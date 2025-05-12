/**
 * Rotas de diagnóstico para testar e demonstrar funcionalidades
 */
import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Rota para criar tabela de demonstração para o componente AutoSaveDemo
router.post('/create-demo-table', async (req, res) => {
  try {
    console.log('Solicitação para criar tabela de demonstração recebida');
    
    // Verificar se a tabela já existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'demo_forms'
      ) as exists;
    `);

    if (!checkResult.rows[0].exists) {
      console.log("Criando tabela demo_forms via API...");
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS demo_forms (
          id SERIAL PRIMARY KEY,
          form_title VARCHAR(255) NOT NULL,
          form_data JSONB,
          status VARCHAR(50) DEFAULT 'rascunho',
          created_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      // Inserir alguns dados de exemplo
      await pool.query(`
        INSERT INTO demo_forms (form_title, form_data, status, created_by)
        VALUES 
          ('Formulário de Demonstração 1', '{"campo1":"valor1","campo2":"valor2"}', 'rascunho', 'sistema'),
          ('Formulário de Demonstração 2', '{"campo1":"outro valor","campo2":"teste"}', 'enviado', 'sistema');
      `);
      
      console.log("Tabela demo_forms criada com sucesso via API!");
      return res.status(201).json({ success: true, message: 'Tabela de demonstração criada com sucesso' });
    } 
    
    console.log("Tabela demo_forms já existe.");
    return res.status(200).json({ success: true, message: 'Tabela de demonstração já existe' });
  } catch (error) {
    console.error("Erro ao criar tabela demo_forms via API:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar tabela de demonstração',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para obter dados da tabela demo_forms
router.get('/demo-forms', async (req, res) => {
  try {
    // Verificar se a tabela existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'demo_forms'
      ) as exists;
    `);

    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tabela de demonstração não existe. Use a rota create-demo-table para criá-la.'
      });
    }

    // Buscar dados da tabela
    const result = await pool.query(`
      SELECT * FROM demo_forms ORDER BY created_at DESC LIMIT 10
    `);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error("Erro ao buscar dados da tabela demo_forms:", error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados da tabela de demonstração',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para salvar dados na tabela demo_forms
router.post('/demo-forms', async (req, res) => {
  try {
    const { form_title, form_data, status = 'rascunho', created_by = 'usuário' } = req.body;
    
    if (!form_title) {
      return res.status(400).json({
        success: false,
        message: 'Título do formulário é obrigatório'
      });
    }
    
    // Verificar se a tabela existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'demo_forms'
      ) as exists;
    `);

    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tabela de demonstração não existe. Use a rota create-demo-table para criá-la.'
      });
    }
    
    // Inserir dados na tabela
    const result = await pool.query(`
      INSERT INTO demo_forms (form_title, form_data, status, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      form_title,
      form_data || {},
      status,
      created_by
    ]);
    
    return res.status(201).json({
      success: true,
      message: 'Dados salvos com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao salvar dados na tabela demo_forms:", error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao salvar dados na tabela de demonstração',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
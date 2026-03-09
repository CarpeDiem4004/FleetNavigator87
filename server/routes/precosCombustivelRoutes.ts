import { Express } from 'express';
import { pool } from '../db';
import { unifiedAuthMiddleware, requireRoles, adminRoleMiddleware } from "../utils/auth-utils.js";

export function registerPrecosCombustivelRoutes(app: Express) {
  // Obter preços do combustível (endpoint público)
  app.get('/api/precos-combustivel', async (req, res) => {
    try {
      const query = 'SELECT * FROM preco_combustivel ORDER BY tipo';
      const result = await pool.query(query);
      
      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao buscar preços do combustível:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar preços do combustível',
        error: String(error)
      });
    }
  });

  // Obter preço por tipo de combustível (endpoint público)
  app.get('/api/precos-combustivel/:tipo', async (req, res) => {
    try {
      const { tipo } = req.params;
      
      const query = 'SELECT * FROM preco_combustivel WHERE tipo = $1';
      const result = await pool.query(query, [tipo]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: `Preço para o combustível ${tipo} não encontrado`
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error(`Erro ao buscar preço para combustível ${req.params.tipo}:`, error);
      return res.status(500).json({
        success: false,
        message: `Erro ao buscar preço para combustível ${req.params.tipo}`,
        error: String(error)
      });
    }
  });

  // Atualizar ou inserir preço de combustível
  app.post('/api/precos-combustivel', unifiedAuthMiddleware, adminRoleMiddleware, async (req, res) => {
    try {
      // O adminRoleMiddleware já garante que o usuário é admin

      const { tipo, valor_litro } = req.body;
      
      // Validação básica
      if (!tipo || valor_litro === undefined || valor_litro === null) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. Tipo e valor_litro são obrigatórios.'
        });
      }
      
      // Verificar se o combustível já existe
      const checkQuery = 'SELECT id FROM preco_combustivel WHERE tipo = $1';
      const checkResult = await pool.query(checkQuery, [tipo]);
      
      let result;
      if (checkResult.rowCount > 0) {
        // Atualizar preço existente
        const updateQuery = `
          UPDATE preco_combustivel 
          SET valor_litro = $1, updated_at = NOW()
          WHERE tipo = $2
          RETURNING *
        `;
        result = await pool.query(updateQuery, [valor_litro, tipo]);
      } else {
        // Inserir novo preço
        const insertQuery = `
          INSERT INTO preco_combustivel (tipo, valor_litro)
          VALUES ($1, $2)
          RETURNING *
        `;
        result = await pool.query(insertQuery, [tipo, valor_litro]);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Preço atualizado com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar preço do combustível:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar preço do combustível',
        error: String(error)
      });
    }
  });
}
import type { Express } from "express";
import { pool } from "../db";

/**
 * Registra as rotas para gerenciar o mapeamento de postos
 */
export function registerPostosMapeamentoRoutes(app: Express) {
  // Rota para buscar todos os postos
  app.get("/api/postos-mapeamento", async (req, res) => {
    try {
      console.log("[API] Buscando todos os postos do mapeamento");
      
      const query = `
        SELECT * 
        FROM postos_mapeamento 
        WHERE ativo = true 
        ORDER BY nome_para_exibicao
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error("[API] Erro ao buscar postos do mapeamento:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar postos do mapeamento",
        error: String(error)
      });
    }
  });
  
  // Rota para buscar posto pelo nome
  app.get("/api/postos-mapeamento/:nome", async (req, res) => {
    try {
      const nome = req.params.nome.toLowerCase();
      console.log(`[API] Buscando posto do mapeamento: ${nome}`);
      
      const query = {
        text: `
          SELECT * 
          FROM postos_mapeamento 
          WHERE LOWER(nome) = $1 
          OR LOWER(nome_para_exibicao) = $1 
          LIMIT 1
        `,
        values: [nome]
      };
      
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        // Se não encontrou pelo nome exato, tenta uma busca mais flexível
        const fuzzyQuery = {
          text: `
            SELECT * 
            FROM postos_mapeamento 
            WHERE LOWER(nome) LIKE $1 
            OR LOWER(nome_para_exibicao) LIKE $1
            LIMIT 1
          `,
          values: [`%${nome}%`]
        };
        
        const fuzzyResult = await pool.query(fuzzyQuery);
        
        if (fuzzyResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: `Posto "${nome}" não encontrado no mapeamento`
          });
        }
        
        res.json({
          success: true,
          data: fuzzyResult.rows[0],
          message: "Posto encontrado com correspondência parcial"
        });
      } else {
        res.json({
          success: true,
          data: result.rows[0]
        });
      }
    } catch (error) {
      console.error(`[API] Erro ao buscar posto do mapeamento "${req.params.nome}":`, error);
      res.status(500).json({
        success: false,
        message: `Erro ao buscar posto do mapeamento "${req.params.nome}"`,
        error: String(error)
      });
    }
  });
  
  // Rota para atualizar campos do questionário
  app.put("/api/postos-mapeamento/:nome/questionario", async (req, res) => {
    try {
      const nome = req.params.nome.toLowerCase();
      const { campos_questionario } = req.body;
      
      if (!campos_questionario) {
        return res.status(400).json({
          success: false,
          message: "Campos do questionário não fornecidos"
        });
      }
      
      console.log(`[API] Atualizando campos do questionário para o posto: ${nome}`);
      
      const updateQuery = {
        text: `
          UPDATE postos_mapeamento 
          SET 
            campos_questionario = $1,
            updated_at = NOW()
          WHERE LOWER(nome) = $2
          RETURNING *
        `,
        values: [campos_questionario, nome]
      };
      
      const result = await pool.query(updateQuery);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Posto "${nome}" não encontrado no mapeamento`
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0],
        message: "Campos do questionário atualizados com sucesso"
      });
    } catch (error) {
      console.error(`[API] Erro ao atualizar campos do questionário para o posto "${req.params.nome}":`, error);
      res.status(500).json({
        success: false,
        message: `Erro ao atualizar campos do questionário para o posto "${req.params.nome}"`,
        error: String(error)
      });
    }
  });
  
  // Rota para criar um novo posto no mapeamento
  app.post("/api/postos-mapeamento", async (req, res) => {
    try {
      const {
        nome,
        nome_para_exibicao,
        tipo,
        campos_questionario,
        ativo
      } = req.body;
      
      if (!nome || !nome_para_exibicao) {
        return res.status(400).json({
          success: false,
          message: "Nome e nome_para_exibicao são obrigatórios"
        });
      }
      
      console.log(`[API] Criando novo posto no mapeamento: ${nome_para_exibicao}`);
      
      const insertQuery = {
        text: `
          INSERT INTO postos_mapeamento (
            nome, 
            nome_para_exibicao, 
            tipo, 
            campos_questionario, 
            ativo
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        values: [
          nome.toLowerCase(),
          nome_para_exibicao,
          tipo || 'posto',
          campos_questionario || {},
          ativo !== undefined ? ativo : true
        ]
      };
      
      const result = await pool.query(insertQuery);
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: "Posto criado com sucesso no mapeamento"
      });
    } catch (error) {
      console.error("[API] Erro ao criar posto no mapeamento:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao criar posto no mapeamento",
        error: String(error)
      });
    }
  });
}
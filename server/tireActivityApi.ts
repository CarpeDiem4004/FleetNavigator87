import { pool } from './db';
import express from 'express';

// Interface para a atividade de pneu
interface TireActivity {
  id?: number;
  pneu_id: number;
  usuario_id: string;
  usuario_email: string;
  usuario_nome: string;
  acao: 'montagem' | 'remocao' | 'descarte' | 'manutencao' | 'cadastro' | 'atualizacao';
  detalhes?: Record<string, any>;
  data: string;
  veiculo_placa?: string;
}

// Função para criar a tabela se ela não existir
export async function setupTireActivityTable() {
  try {
    // Verifica se a tabela já existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pneus_atividades'
      );
    `);

    const tableExists = checkResult.rows[0].exists;

    if (!tableExists) {
      // Cria a tabela se ela não existir
      await pool.query(`
        CREATE TABLE pneus_atividades (
          id SERIAL PRIMARY KEY,
          pneu_id INTEGER NOT NULL,
          usuario_id VARCHAR(100) NOT NULL,
          usuario_email VARCHAR(255) NOT NULL,
          usuario_nome VARCHAR(255) NOT NULL,
          acao VARCHAR(50) NOT NULL,
          detalhes JSONB,
          data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          veiculo_placa VARCHAR(50)
        );
      `);
      console.log('Tabela pneus_atividades criada com sucesso');
    }
  } catch (error) {
    console.error('Erro ao configurar tabela de atividades de pneus:', error);
  }
}

// Configuração das rotas para atividades de pneus
export function setupTireActivityRoutes(app: express.Express) {
  // Rota para registrar uma nova atividade
  app.post('/api/pneus/atividades', async (req, res) => {
    try {
      const activity: TireActivity = req.body;

      // Validação básica
      if (!activity.pneu_id || !activity.acao) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. pneu_id e acao são obrigatórios.'
        });
      }

      // Inserção na tabela 
      const result = await pool.query(`
        INSERT INTO pneus_atividades (
          pneu_id, usuario_id, usuario_email, usuario_nome,
          acao, detalhes, data, veiculo_placa
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `, [
        activity.pneu_id,
        activity.usuario_id,
        activity.usuario_email,
        activity.usuario_nome,
        activity.acao,
        activity.detalhes ? JSON.stringify(activity.detalhes) : null,
        activity.data || new Date().toISOString(),
        activity.veiculo_placa || null
      ]);

      res.status(201).json({
        success: true,
        message: 'Atividade registrada com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar atividade de pneu'
      });
    }
  });

  // Rota para obter atividades de um pneu específico
  app.get('/api/pneus/atividades/:tireId', async (req, res) => {
    try {
      const tireId = req.params.tireId;

      const result = await pool.query(`
        SELECT * FROM pneus_atividades
        WHERE pneu_id = $1
        ORDER BY data DESC;
      `, [tireId]);

      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar atividades do pneu:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar atividades do pneu'
      });
    }
  });

  // Rota para obter atividades por usuário
  app.get('/api/pneus/atividades/usuario/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;

      const result = await pool.query(`
        SELECT * FROM pneus_atividades
        WHERE usuario_id = $1
        ORDER BY data DESC;
      `, [userId]);

      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar atividades do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar atividades do usuário'
      });
    }
  });

  // Rota para obter estatísticas gerais
  app.get('/api/pneus/atividades/stats/geral', async (req, res) => {
    try {
      // Total de montagens
      const montagensResult = await pool.query(`
        SELECT COUNT(*) FROM pneus_atividades WHERE acao = 'montagem';
      `);
      
      // Total de remoções
      const removalsResult = await pool.query(`
        SELECT COUNT(*) FROM pneus_atividades WHERE acao = 'remocao';
      `);
      
      // Total de descartes
      const discardResult = await pool.query(`
        SELECT COUNT(*) FROM pneus_atividades WHERE acao = 'descarte';
      `);
      
      // Total de manutenções
      const maintenanceResult = await pool.query(`
        SELECT COUNT(*) FROM pneus_atividades WHERE acao = 'manutencao';
      `);
      
      // Usuários mais ativos
      const activeUsersResult = await pool.query(`
        SELECT usuario_nome, COUNT(*) as total
        FROM pneus_atividades
        GROUP BY usuario_nome
        ORDER BY total DESC
        LIMIT 5;
      `);

      res.status(200).json({
        totalMontagens: parseInt(montagensResult.rows[0]?.count || '0'),
        totalRemocoes: parseInt(removalsResult.rows[0]?.count || '0'),
        totalDescartes: parseInt(discardResult.rows[0]?.count || '0'),
        totalManutencoes: parseInt(maintenanceResult.rows[0]?.count || '0'),
        usuariosMaisAtivos: activeUsersResult.rows.map(row => ({
          usuario_nome: row.usuario_nome,
          total: parseInt(row.total)
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de atividades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas de atividades'
      });
    }
  });
}
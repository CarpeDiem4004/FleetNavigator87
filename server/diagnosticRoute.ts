/**
 * Rota de diagnóstico independente para verificar a conexão com o banco de dados
 * Esta rota é completamente separada do sistema de rotas regular
 * e não utiliza nenhum middleware de autenticação.
 */
import express from 'express';
import { pool } from './db';

const router = express.Router();

// Rota pública para diagnóstico de banco de dados
router.get('/diagnostic/database', async (req, res) => {
  try {
    console.log('[Diagnostic] Verificando conexão com o banco de dados...');
    
    // Testar conexão com SELECT NOW()
    try {
      console.log('[Diagnostic] Executando SELECT NOW()...');
      const testResult = await pool.query('SELECT NOW() as current_time');
      console.log('[Diagnostic] Conexão bem-sucedida, hora atual:', testResult.rows[0].current_time);
      
      // Testar consulta para contagem de usuários
      const countResult = await pool.query('SELECT COUNT(*) as user_count FROM users');
      console.log(`[Diagnostic] Total de ${countResult.rows[0].user_count} usuário(s) no banco`);
      
      // Verificar status do pool
      const poolStats = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      };
      console.log('[Diagnostic] Status do pool:', poolStats);
      
      // Verificar existência de tabelas importantes
      const tablesQuery = `
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      const tablesResult = await pool.query(tablesQuery);
      console.log(`[Diagnostic] Total de ${tablesResult.rows.length} tabelas encontradas`);
      
      // Analisar estrutura da tabela users
      const usersStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      return res.status(200).json({
        success: true,
        message: "Banco de dados conectado com sucesso",
        timestamp: testResult.rows[0].current_time,
        poolInfo: poolStats,
        database: {
          userCount: parseInt(countResult.rows[0].user_count),
          tableCount: tablesResult.rows.length,
          tables: tablesResult.rows.map(row => row.table_name),
          usersTable: {
            columnCount: usersStructure.rows.length,
            columns: usersStructure.rows
          }
        },
        environment: {
          node_env: process.env.NODE_ENV,
          database_url: process.env.DATABASE_URL ? (process.env.DATABASE_URL.substring(0, 20) + '...') : 'Não definido',
          supabase_url: process.env.SUPABASE_URL ? (process.env.SUPABASE_URL.substring(0, 20) + '...') : 'Não definido'
        }
      });
    } catch (dbErr: any) {
      console.error('[Diagnostic] Erro na conexão com o banco:', dbErr);
      return res.status(500).json({
        success: false,
        message: 'Erro na conexão com o banco de dados',
        error: dbErr.message,
        stack: dbErr.stack
      });
    }
  } catch (error) {
    console.error('[Diagnostic] Erro geral no diagnóstico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro geral no diagnóstico',
      error: String(error)
    });
  }
});

// Rota pública para verificar status do servidor
router.get('/diagnostic/status', (req, res) => {
  const uptime = process.uptime();
  const uptimeFormatted = {
    days: Math.floor(uptime / 86400),
    hours: Math.floor((uptime % 86400) / 3600),
    minutes: Math.floor((uptime % 3600) / 60),
    seconds: Math.floor(uptime % 60)
  };
  
  res.status(200).json({
    success: true,
    message: "Servidor em execução",
    timestamp: new Date().toISOString(),
    uptime: uptimeFormatted,
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

export default router;
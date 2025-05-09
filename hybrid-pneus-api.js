/**
 * API para gerenciamento de pneus híbrida
 * Funciona tanto no ambiente Replit quanto externamente
 */
import express from 'express';
import { getHybridUserService } from './hybrid-user-service.js';
import { createClient } from '@supabase/supabase-js';
import { pool as PG_POOL } from './server/db.js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para verificar o ambiente (Replit ou externo)
function isEnvironmentSupabase() {
  return process.env.ENVIRONMENT === 'external' || !process.env.DATABASE_URL;
}

const router = express.Router();
const userService = getHybridUserService();

// Middleware de autenticação
const authenticateMiddleware = async (req, res, next) => {
  try {
    // Verifica se o token foi fornecido no cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar o token 
    const user = await userService.verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    
    // Verificar permissões
    if (!['admin', 'pneus'].includes(user.role)) {
      return res.status(403).json({ 
        message: 'Acesso não autorizado. Você não tem permissões para gerenciar pneus.' 
      });
    }
    
    // Adicionar o usuário ao objeto req
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro ao autenticar requisição:', error);
    res.status(500).json({ message: 'Erro ao processar autenticação' });
  }
};

/**
 * Função para obter uma conexão com o banco conforme o ambiente
 */
function getDbConnection() {
  if (isEnvironmentSupabase()) {
    return getSupabaseClient();
  } else {
    return PG_POOL;
  }
}

/**
 * Função para obter a conexão direta com o PostgreSQL
 * Usada para sincronização com tabelas específicas
 */
function getPgPool() {
  return PG_POOL;
}

/**
 * Rota para listar todos os pneus
 * GET /api/hybrid/pneus
 */
router.get('/', authenticateMiddleware, async (req, res) => {
  try {
    const conn = getDbConnection();
    let result;
    
    // Consultar conforme o ambiente
    if (isEnvironmentSupabase()) {
      const { data, error } = await conn
        .from('pneus_completo')
        .select('*')
        .order('codigo', { ascending: true });
        
      if (error) throw error;
      result = data;
    } else {
      const queryResult = await conn.query('SELECT * FROM pneus_completo ORDER BY codigo');
      result = queryResult.rows;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar pneus:', error);
    res.status(500).json({ message: 'Erro ao listar pneus', error: error.message });
  }
});

/**
 * Rota para obter um pneu pelo ID
 * GET /api/hybrid/pneus/:id
 */
router.get('/:id', authenticateMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const conn = getDbConnection();
    let result;
    
    // Consultar conforme o ambiente
    if (isEnvironmentSupabase()) {
      const { data, error } = await conn
        .from('pneus_completo')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      result = data;
    } else {
      const queryResult = await conn.query('SELECT * FROM pneus_completo WHERE id = $1', [id]);
      result = queryResult.rows[0];
    }
    
    if (!result) {
      return res.status(404).json({ message: 'Pneu não encontrado' });
    }
    
    res.json(result);
  } catch (error) {
    console.error(`Erro ao buscar pneu ${req.params.id}:`, error);
    res.status(500).json({ message: 'Erro ao buscar pneu', error: error.message });
  }
});

/**
 * Rota para criar um novo pneu
 * POST /api/hybrid/pneus
 */
router.post('/', authenticateMiddleware, async (req, res) => {
  try {
    const pneuData = req.body;
    const conn = getDbConnection();
    let result;
    
    // Registrar a criação conforme o ambiente
    if (isEnvironmentSupabase()) {
      const { data, error } = await conn
        .from('pneus_completo')
        .insert(pneuData)
        .select();
        
      if (error) throw error;
      result = data[0];
      
      // Registrar para sincronização
      await conn
        .from('sync_control')
        .insert({
          tipo_item: 'pneu',
          item_id: result.id.toString(),
          direcao: 'externo_para_replit',
          status: 'pendente'
        });
    } else {
      // Construir a query de inserção dinamicamente
      const keys = Object.keys(pneuData);
      const values = Object.values(pneuData);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const queryResult = await conn.query(
        `INSERT INTO pneus_completo (${keys.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values
      );
      
      result = queryResult.rows[0];
      
      // Registrar para sincronização
      await conn.query(
        `INSERT INTO sync_control (tipo_item, item_id, direcao, status)
         VALUES ('pneu', $1, 'replit_para_externo', 'pendente')`,
        [result.id.toString()]
      );
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar pneu:', error);
    res.status(500).json({ message: 'Erro ao criar pneu', error: error.message });
  }
});

/**
 * Rota para atualizar um pneu
 * PUT /api/hybrid/pneus/:id
 */
router.put('/:id', authenticateMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const pneuData = req.body;
    const conn = getDbConnection();
    let result;
    
    // Atualizar conforme o ambiente
    if (isEnvironmentSupabase()) {
      const { data, error } = await conn
        .from('pneus_completo')
        .update(pneuData)
        .eq('id', id)
        .select();
        
      if (error) throw error;
      result = data[0];
      
      // Registrar para sincronização
      await conn
        .from('sync_control')
        .insert({
          tipo_item: 'pneu',
          item_id: id.toString(),
          direcao: 'externo_para_replit',
          status: 'pendente'
        });
    } else {
      // Construir a query de atualização dinamicamente
      const entries = Object.entries(pneuData);
      const setClause = entries
        .map(([key], i) => `${key} = $${i + 2}`)
        .join(', ');
      
      const queryResult = await conn.query(
        `UPDATE pneus_completo
         SET ${setClause}
         WHERE id = $1
         RETURNING *`,
        [id, ...entries.map(([_, value]) => value)]
      );
      
      if (queryResult.rowCount === 0) {
        return res.status(404).json({ message: 'Pneu não encontrado' });
      }
      
      result = queryResult.rows[0];
      
      // Registrar para sincronização
      await conn.query(
        `INSERT INTO sync_control (tipo_item, item_id, direcao, status)
         VALUES ('pneu', $1, 'replit_para_externo', 'pendente')`,
        [id.toString()]
      );
    }
    
    res.json(result);
  } catch (error) {
    console.error(`Erro ao atualizar pneu ${req.params.id}:`, error);
    res.status(500).json({ message: 'Erro ao atualizar pneu', error: error.message });
  }
});

/**
 * Rota para registrar movimentação de pneu
 * POST /api/hybrid/pneus/:id/movimentacao
 */
router.post('/:id/movimentacao', authenticateMiddleware, async (req, res) => {
  try {
    const pneuId = req.params.id;
    const movimentacaoData = {
      ...req.body,
      id_pneu: pneuId,
      responsavel: req.user.name
    };
    
    const conn = getDbConnection();
    let result;
    
    // Registrar movimentação conforme o ambiente
    if (isEnvironmentSupabase()) {
      const { data, error } = await conn
        .from('movimentacao_pneu')
        .insert(movimentacaoData)
        .select();
        
      if (error) throw error;
      result = data[0];
      
      // Registrar para sincronização
      await conn
        .from('sync_control')
        .insert({
          tipo_item: 'movimentacao_pneu',
          item_id: result.id.toString(),
          direcao: 'externo_para_replit',
          status: 'pendente'
        });
      
      // Atualizar status do pneu
      if (movimentacaoData.tipo_movimentacao === 'montagem') {
        await conn
          .from('pneus_completo')
          .update({ status: 'montado' })
          .eq('id', pneuId);
      } else if (movimentacaoData.tipo_movimentacao === 'desmontagem') {
        await conn
          .from('pneus_completo')
          .update({ status: 'disponivel' })
          .eq('id', pneuId);
      }
    } else {
      // Construir a query de inserção dinamicamente
      const keys = Object.keys(movimentacaoData);
      const values = Object.values(movimentacaoData);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const queryResult = await conn.query(
        `INSERT INTO movimentacao_pneu (${keys.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values
      );
      
      result = queryResult.rows[0];
      
      // Registrar para sincronização
      await conn.query(
        `INSERT INTO sync_control (tipo_item, item_id, direcao, status)
         VALUES ('movimentacao_pneu', $1, 'replit_para_externo', 'pendente')`,
        [result.id.toString()]
      );
      
      // Atualizar status do pneu
      if (movimentacaoData.tipo_movimentacao === 'montagem') {
        await conn.query(
          `UPDATE pneus_completo SET status = 'montado' WHERE id = $1`,
          [pneuId]
        );
      } else if (movimentacaoData.tipo_movimentacao === 'desmontagem') {
        await conn.query(
          `UPDATE pneus_completo SET status = 'disponivel' WHERE id = $1`,
          [pneuId]
        );
      }
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error(`Erro ao registrar movimentação do pneu ${req.params.id}:`, error);
    res.status(500).json({ message: 'Erro ao registrar movimentação', error: error.message });
  }
});

/**
 * Rota para criar solicitação de pneus
 * POST /api/hybrid/pneus/solicitacoes
 */
router.post('/solicitacoes', authenticateMiddleware, async (req, res) => {
  try {
    const solicitacaoData = {
      ...req.body,
      usuario_id: req.user.id,
      usuario_nome: req.user.name,
      status: 'pendente'
    };
    
    const conn = getDbConnection();
    let result;
    
    // Registrar solicitação conforme o ambiente
    if (isEnvironmentSupabase()) {
      const { data, error } = await conn
        .from('solicitacoes_pneus')
        .insert(solicitacaoData)
        .select();
        
      if (error) throw error;
      result = data[0];
      
      // Registrar para sincronização
      await conn
        .from('sync_control')
        .insert({
          tipo_item: 'solicitacao_pneu',
          item_id: result.id.toString(),
          direcao: 'externo_para_replit',
          status: 'pendente'
        });
    } else {
      // Construir a query de inserção dinamicamente
      const keys = Object.keys(solicitacaoData);
      const values = Object.values(solicitacaoData);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const queryResult = await conn.query(
        `INSERT INTO solicitacoes_pneus (${keys.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values
      );
      
      result = queryResult.rows[0];
      
      // Registrar para sincronização
      await conn.query(
        `INSERT INTO sync_control (tipo_item, item_id, direcao, status)
         VALUES ('solicitacao_pneu', $1, 'replit_para_externo', 'pendente')`,
        [result.id.toString()]
      );
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar solicitação de pneus:', error);
    res.status(500).json({ message: 'Erro ao criar solicitação', error: error.message });
  }
});

/**
 * Rota para listar solicitações de pneus
 * GET /api/hybrid/pneus/solicitacoes
 */
router.get('/solicitacoes', authenticateMiddleware, async (req, res) => {
  try {
    const conn = getDbConnection();
    let result;
    
    // Consultar conforme o ambiente
    if (isEnvironmentSupabase()) {
      const { data, error } = await conn
        .from('solicitacoes_pneus')
        .select('*')
        .order('data_solicitacao', { ascending: false });
        
      if (error) throw error;
      result = data;
    } else {
      const queryResult = await conn.query(
        'SELECT * FROM solicitacoes_pneus ORDER BY data_solicitacao DESC'
      );
      result = queryResult.rows;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar solicitações de pneus:', error);
    res.status(500).json({ message: 'Erro ao listar solicitações', error: error.message });
  }
});

/**
 * Rota para atualizar o status de uma solicitação de pneus
 * PUT /api/hybrid/pneus/solicitacoes/:id
 */
router.put('/solicitacoes/:id', authenticateMiddleware, async (req, res) => {
  try {
    const solicitacaoId = req.params.id;
    const { status, observacoes } = req.body;
    
    if (!['pendente', 'aprovado', 'negado', 'concluido', 'em_processamento'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status inválido. Valores aceitos: pendente, aprovado, negado, concluido, em_processamento' 
      });
    }
    
    const conn = getDbConnection();
    let result;
    
    console.log(`[HybridPneusAPI] Atualizando status da solicitação ${solicitacaoId} para ${status}`);
    
    // Atualizar conforme o ambiente
    if (isEnvironmentSupabase()) {
      const { data, error } = await conn
        .from('solicitacoes_pneus')
        .update({
          status: status,
          observacoes: observacoes || null,
          data_aprovacao: status === 'aprovado' ? new Date() : null,
          aprovador_id: status === 'aprovado' ? req.user.id : null,
          aprovador_nome: status === 'aprovado' ? req.user.name : null
        })
        .eq('id', solicitacaoId)
        .select();
        
      if (error) throw error;
      result = data[0];
    } else {
      const updateQuery = `
        UPDATE solicitacoes_pneus
        SET 
          status = $1,
          observacoes = COALESCE($2, observacoes),
          data_aprovacao = $3,
          aprovador_id = $4,
          aprovador_nome = $5
        WHERE id = $6
        RETURNING *
      `;
      
      const updateValues = [
        status,
        observacoes,
        status === 'aprovado' ? new Date() : null,
        status === 'aprovado' ? req.user.id : null,
        status === 'aprovado' ? req.user.name : null,
        solicitacaoId
      ];
      
      const queryResult = await conn.query(updateQuery, updateValues);
      result = queryResult.rows[0];
    }
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada'
      });
    }
    
    // Verificar se é uma solicitação originada da Base Campinas e sincronizar de volta
    try {
      if (result.origem === 'base_campinas' && result.id_origem) {
        console.log(`[HybridPneusAPI] Sincronizando status com Base Campinas (ID origem: ${result.id_origem})`);
        
        // Tentar atualizar a tabela local tire_requests da base Campinas
        const updateOriginQuery = `
          UPDATE tire_requests 
          SET 
            status = $1,
            observacoes = COALESCE($2, observacoes),
            data_aprovacao = $3,
            aprovador_id = $4
          WHERE id = $5
        `;
        
        const pgPool = getPgPool(); // Função que retorna a conexão direta com PostgreSQL
        if (pgPool) {
          await pgPool.query(updateOriginQuery, [
            status,
            observacoes,
            status === 'aprovado' ? new Date() : null,
            status === 'aprovado' ? req.user.id : null,
            result.id_origem
          ]);
          
          console.log(`[HybridPneusAPI] Sincronização com Base Campinas concluída (ID: ${result.id_origem})`);
        }
      }
    } catch (syncError) {
      console.error('[HybridPneusAPI] Erro ao sincronizar com Base Campinas:', syncError);
      // Não falhar a operação principal se a sincronização falhar
    }
    
    res.json({
      success: true,
      message: `Status da solicitação atualizado para ${status}`,
      data: result
    });
  } catch (error) {
    console.error('Erro ao atualizar solicitação de pneus:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar solicitação', 
      error: error.message 
    });
  }
});

/**
 * Rota para obter histórico de movimentações de um pneu
 * GET /api/hybrid/pneus/:id/historico
 */
router.get('/:id/historico', authenticateMiddleware, async (req, res) => {
  try {
    const pneuId = req.params.id;
    const conn = getDbConnection();
    let result;
    
    // Consultar conforme o ambiente
    if (isEnvironmentSupabase()) {
      const { data, error } = await conn
        .from('movimentacao_pneu')
        .select('*')
        .eq('id_pneu', pneuId)
        .order('data', { ascending: false });
        
      if (error) throw error;
      result = data;
    } else {
      const queryResult = await conn.query(
        'SELECT * FROM movimentacao_pneu WHERE id_pneu = $1 ORDER BY data DESC',
        [pneuId]
      );
      result = queryResult.rows;
    }
    
    res.json(result);
  } catch (error) {
    console.error(`Erro ao obter histórico do pneu ${req.params.id}:`, error);
    res.status(500).json({ message: 'Erro ao obter histórico', error: error.message });
  }
});

// Exportar o router para usar em server/index.js
export default router;
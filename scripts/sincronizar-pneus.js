/**
 * Módulo para sincronização de pneus entre ambiente Replit e Supabase
 * Este script funciona em ambos os ambientes
 */
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Determinar ambiente
const isReplit = process.env.REPLIT_DB_URL || process.env.REPL_ID || false;
console.log(`Executando em ambiente: ${isReplit ? 'Replit' : 'Externo'}`);

// Configurações
const REPLIT_API_BASE = 'https://murici-on-fleet-joaopaulo68.repl.co/api';
let authToken = null;

// Conexão com banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

/**
 * Obter token de autenticação para API
 */
async function obterTokenAutenticacao() {
  if (isReplit) {
    // No ambiente Replit, podemos acessar diretamente o banco de dados
    return null;
  }
  
  try {
    // Em ambiente externo, precisamos autenticar via API
    const response = await fetch(`${REPLIT_API_BASE}/hybrid/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.API_AUTH_EMAIL,
        password: process.env.API_AUTH_PASSWORD
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro na autenticação: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Erro ao obter token de autenticação:', error);
    throw error;
  }
}

/**
 * Buscar pneus pendentes de sincronização
 */
async function buscarPneusPendentes() {
  try {
    if (isReplit) {
      // No Replit, consultamos diretamente o banco
      const { rows } = await pool.query(
        `SELECT * FROM sync_control 
        WHERE tipo_item = 'pneu' AND status = 'pendente'
        ORDER BY created_at ASC LIMIT 50`
      );
      return rows;
    } else {
      // Em ambiente externo, usamos Supabase
      const { data, error } = await supabase
        .from('sync_control')
        .select('*')
        .eq('tipo_item', 'pneu')
        .eq('status', 'pendente')
        .order('created_at', { ascending: true })
        .limit(50);
        
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Erro ao buscar pneus pendentes:', error);
    return [];
  }
}

/**
 * Buscar dados de um pneu específico
 */
async function buscarDadosPneu(id) {
  try {
    if (isReplit) {
      // No Replit, consultamos diretamente o banco
      const { rows } = await pool.query(
        'SELECT * FROM pneus_completo WHERE id = $1',
        [id]
      );
      return rows[0] || null;
    } else {
      // Em ambiente externo, usamos Supabase
      const { data, error } = await supabase
        .from('pneus_completo')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  } catch (error) {
    console.error(`Erro ao buscar dados do pneu ${id}:`, error);
    return null;
  }
}

/**
 * Sincronizar um pneu para o ambiente externo (do Replit para Supabase)
 */
async function sincronizarParaExterno(pneuId) {
  try {
    console.log(`Sincronizando pneu ${pneuId} para ambiente externo (Supabase)...`);
    
    // Buscar dados do pneu
    const pneu = await buscarDadosPneu(pneuId);
    if (!pneu) {
      console.warn(`Pneu ${pneuId} não encontrado para sincronização.`);
      return false;
    }
    
    // Enviar para o Supabase
    const { data, error } = await supabase
      .from('pneus_completo')
      .upsert(pneu, { onConflict: 'id' });
      
    if (error) throw error;
    
    console.log(`Pneu ${pneuId} sincronizado com sucesso para o ambiente externo.`);
    return true;
  } catch (error) {
    console.error(`Erro ao sincronizar pneu ${pneuId} para ambiente externo:`, error);
    return false;
  }
}

/**
 * Sincronizar um pneu para o ambiente Replit (do Supabase para Replit)
 */
async function sincronizarParaReplit(pneuId) {
  try {
    console.log(`Sincronizando pneu ${pneuId} para ambiente Replit...`);
    
    // Buscar dados do pneu no Supabase
    const pneu = await buscarDadosPneu(pneuId);
    if (!pneu) {
      console.warn(`Pneu ${pneuId} não encontrado para sincronização.`);
      return false;
    }
    
    if (isReplit) {
      // No ambiente Replit, inserimos diretamente no banco
      const result = await pool.query(
        `INSERT INTO pneus_completo 
        (id, tire_number, change_date, change_km, status, codigo, marca, modelo, 
         medida, aro, tipo, origem, data_aquisicao, veiculo_placa, posicao, 
         km_inicial, km_atual, profundidade_sulco, localizacao, observacao, 
         created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
                $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO UPDATE SET
          tire_number = $2,
          change_date = $3,
          change_km = $4,
          status = $5,
          codigo = $6,
          marca = $7,
          modelo = $8,
          medida = $9,
          aro = $10,
          tipo = $11,
          origem = $12,
          data_aquisicao = $13,
          veiculo_placa = $14,
          posicao = $15,
          km_inicial = $16,
          km_atual = $17,
          profundidade_sulco = $18,
          localizacao = $19,
          observacao = $20,
          updated_at = NOW()`,
        [
          pneu.id, pneu.tire_number, pneu.change_date, pneu.change_km, 
          pneu.status, pneu.codigo, pneu.marca, pneu.modelo, pneu.medida, 
          pneu.aro, pneu.tipo, pneu.origem, pneu.data_aquisicao, 
          pneu.veiculo_placa, pneu.posicao, pneu.km_inicial, pneu.km_atual, 
          pneu.profundidade_sulco, pneu.localizacao, pneu.observacao, 
          pneu.created_at, pneu.updated_at
        ]
      );
    } else {
      // Em ambiente externo, chamamos a API do Replit
      if (!authToken) {
        authToken = await obterTokenAutenticacao();
      }
      
      const response = await fetch(`${REPLIT_API_BASE}/hybrid/pneus/${pneuId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(pneu)
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao sincronizar via API: ${response.status}`);
      }
    }
    
    console.log(`Pneu ${pneuId} sincronizado com sucesso para o ambiente Replit.`);
    return true;
  } catch (error) {
    console.error(`Erro ao sincronizar pneu ${pneuId} para ambiente Replit:`, error);
    return false;
  }
}

/**
 * Atualizar status de sincronização
 */
async function atualizarStatusSincronizacao(itemId, sucesso) {
  try {
    const novoStatus = sucesso ? 'sincronizado' : 'erro';
    
    if (isReplit) {
      // No Replit, atualizamos diretamente no banco
      await pool.query(
        `UPDATE sync_control 
         SET status = $1, updated_at = NOW() 
         WHERE item_id = $2 AND tipo_item = 'pneu'`,
        [novoStatus, itemId]
      );
    } else {
      // Em ambiente externo, usamos Supabase
      const { error } = await supabase
        .from('sync_control')
        .update({ 
          status: novoStatus, 
          updated_at: new Date()
        })
        .eq('item_id', itemId)
        .eq('tipo_item', 'pneu');
        
      if (error) throw error;
    }
  } catch (error) {
    console.error(`Erro ao atualizar status de sincronização do item ${itemId}:`, error);
  }
}

/**
 * Função principal para executar a sincronização
 */
async function executarSincronizacao() {
  try {
    console.log(`Iniciando sincronização de pneus em ${new Date().toISOString()}`);
    
    const itensPendentes = await buscarPneusPendentes();
    console.log(`Encontrados ${itensPendentes.length} pneus pendentes de sincronização.`);
    
    if (itensPendentes.length === 0) {
      console.log('Nenhum item pendente para sincronização.');
      return;
    }
    
    for (const item of itensPendentes) {
      console.log(`Processando item ${item.id}, pneu ${item.item_id}, direção: ${item.direcao}`);
      
      let sucesso = false;
      if (item.direcao === 'replit_para_externo') {
        sucesso = await sincronizarParaExterno(item.item_id);
      } else if (item.direcao === 'externo_para_replit') {
        sucesso = await sincronizarParaReplit(item.item_id);
      }
      
      await atualizarStatusSincronizacao(item.item_id, sucesso);
    }
    
    console.log(`Sincronização de pneus concluída em ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Erro ao executar sincronização de pneus:', error);
  }
}

// Exportar funções para uso em outros módulos
module.exports = {
  executarSincronizacao,
  sincronizarParaExterno,
  sincronizarParaReplit
};

// Se executado diretamente via CLI, rodar a sincronização
if (require.main === module) {
  executarSincronizacao()
    .then(() => {
      console.log('Execução da sincronização concluída.');
      // Fechar conexões após execução
      setTimeout(() => {
        pool.end();
        process.exit(0);
      }, 1000);
    })
    .catch(err => {
      console.error('Erro fatal na sincronização:', err);
      process.exit(1);
    });
}
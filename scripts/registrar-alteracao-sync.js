const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Registra uma alteração para sincronização
 * @param {string} tipo - Tipo de item alterado (ex: 'pneu')
 * @param {string} itemId - ID do item alterado
 * @param {string} direcao - 'replit_para_externo' ou 'externo_para_replit'
 */
async function registrarAlteracaoParaSincronizacao(tipo, itemId, direcao) {
  try {
    await pool.query(
      `INSERT INTO sync_control (tipo_item, item_id, direcao, status)
       VALUES ($1, $2, $3, 'pendente')`,
      [tipo, itemId, direcao]
    );
    console.log(`Alteração registrada para sincronização: ${tipo} ${itemId}`);
  } catch (error) {
    console.error('Erro ao registrar alteração para sincronização:', error);
  }
}

module.exports = { registrarAlteracaoParaSincronizacao };
/**
 * Script para excluir todas as tabelas de postos no PostgreSQL local,
 * exceto Posto Remédios
 * 
 * ATENÇÃO: Este script remove permanentemente dados! Use com cautela.
 */

import pg from 'pg';

// Configuração de conexão com o banco de dados PostgreSQL local
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Lista de tabelas para manter (não excluir)
const TABELAS_PARA_MANTER = [
  'posto_murici_remedios',
  'posto_remedios_abastecimentos'
];

// Função para listar todas as tabelas de postos
async function listarTabelasPostos() {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND (
          table_name LIKE 'abastecimentos_posto_%' OR
          table_name LIKE 'posto_murici_%'
      )
      AND table_name <> ALL($1)
      ORDER BY table_name;
    `;
    
    const { rows } = await pool.query(query, [TABELAS_PARA_MANTER]);
    return rows.map(row => row.table_name);
  } catch (error) {
    console.error('Erro ao listar tabelas:', error);
    throw error;
  }
}

// Função para listar todas as views de postos
async function listarViewsPostos() {
  try {
    const query = `
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND (
          table_name LIKE 'abastecimentos_posto_%' OR
          table_name LIKE 'posto_murici_%'
      )
      AND table_name NOT LIKE '%remedios%'
      ORDER BY table_name;
    `;
    
    const { rows } = await pool.query(query);
    return rows.map(row => row.table_name);
  } catch (error) {
    console.error('Erro ao listar views:', error);
    throw error;
  }
}

// Função para excluir uma tabela
async function excluirTabela(nomeTabela) {
  try {
    const query = `DROP TABLE IF EXISTS "${nomeTabela}" CASCADE;`;
    await pool.query(query);
    console.log(`Tabela "${nomeTabela}" excluída com sucesso`);
    return true;
  } catch (error) {
    console.error(`Erro ao excluir tabela ${nomeTabela}:`, error);
    return false;
  }
}

// Função para excluir uma view
async function excluirView(nomeView) {
  try {
    const query = `DROP VIEW IF EXISTS "${nomeView}" CASCADE;`;
    await pool.query(query);
    console.log(`View "${nomeView}" excluída com sucesso`);
    return true;
  } catch (error) {
    console.error(`Erro ao excluir view ${nomeView}:`, error);
    return false;
  }
}

// Verificar se uma tabela ou view existe
async function verificarExistencia(nome) {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `;
    const { rows } = await pool.query(query, [nome]);
    return rows[0].exists;
  } catch (error) {
    console.error(`Erro ao verificar existência de ${nome}:`, error);
    return false;
  }
}

// Função principal
async function excluirPostos() {
  try {
    console.log('Iniciando exclusão de postos (exceto Remédios) no PostgreSQL local...');
    
    // Verificar se Posto Remédios existe antes de prosseguir
    const postoRemediosExiste = await verificarExistencia('posto_remedios_abastecimentos');
    if (!postoRemediosExiste) {
      console.error('ERRO: A tabela do Posto Remédios não foi encontrada!');
      console.error('Operação cancelada para evitar perda de dados.');
      return;
    }
    
    // Listar tabelas a serem excluídas
    const tabelas = await listarTabelasPostos();
    console.log(`\nEncontradas ${tabelas.length} tabelas para excluir:`);
    tabelas.forEach(tabela => console.log(`- ${tabela}`));
    
    // Listar views a serem excluídas
    const views = await listarViewsPostos();
    console.log(`\nEncontradas ${views.length} views para excluir:`);
    views.forEach(view => console.log(`- ${view}`));
    
    // Confirmar operação
    console.log('\nAVISO: Esta operação excluirá permanentemente todas as tabelas e views listadas acima.');
    console.log('Prosseguindo com a exclusão...');
    
    // Excluir views primeiro (para evitar dependências)
    console.log('\nExcluindo views:');
    for (const view of views) {
      await excluirView(view);
    }
    
    // Excluir tabelas
    console.log('\nExcluindo tabelas:');
    for (const tabela of tabelas) {
      await excluirTabela(tabela);
    }
    
    // Verificar resultados
    const tabelasRestantes = await listarTabelasPostos();
    const viewsRestantes = await listarViewsPostos();
    
    console.log('\nResultado da operação:');
    console.log(`- Tabelas restantes: ${tabelasRestantes.length}`);
    console.log(`- Views restantes: ${viewsRestantes.length}`);
    
    if (tabelasRestantes.length > 0 || viewsRestantes.length > 0) {
      console.log('\nATENÇÃO: Algumas tabelas ou views não puderam ser excluídas:');
      tabelasRestantes.forEach(t => console.log(`- Tabela: ${t}`));
      viewsRestantes.forEach(v => console.log(`- View: ${v}`));
    } else {
      console.log('\nTodas as tabelas e views foram excluídas com sucesso!');
    }
    
    // Verificar novamente se Posto Remédios ainda existe
    const postoRemediosAindaExiste = await verificarExistencia('posto_remedios_abastecimentos');
    console.log(`\nPosto Remédios ainda existe: ${postoRemediosAindaExiste ? 'SIM' : 'NÃO - ATENÇÃO!'}`);
    
    if (!postoRemediosAindaExiste) {
      console.error('ERRO CRÍTICO: A tabela do Posto Remédios foi excluída acidentalmente!');
    } else {
      console.log('A tabela do Posto Remédios foi preservada como esperado.');
    }
    
  } catch (error) {
    console.error('Erro durante a exclusão de postos:', error);
  } finally {
    // Fechar a pool de conexões
    await pool.end();
  }
}

// Executar o script
excluirPostos().catch(console.error);
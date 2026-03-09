/**
 * Script de documentação de todos os projetos e bases incluídos no sistema
 * Este script lista todos os projetos ativos com suas respectivas bases
 * Para executar: node projects-and-bases-documentation.js
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function listarTodosProjetosEBases() {
  try {
    console.log('\n=== DOCUMENTAÇÃO COMPLETA DOS PROJETOS E BASES ===\n');
    
    // Buscar todos os projetos com suas bases
    const query = `
      SELECT 
        p.id as projeto_id,
        p.name as projeto_nome,
        p.description as projeto_descricao,
        p.is_active as projeto_ativo,
        b.id as base_id,
        b.base_name,
        b.base_code,
        b.description as base_descricao,
        b.is_active as base_ativa
      FROM projects p
      LEFT JOIN project_bases b ON p.id = b.project_id
      WHERE p.is_active = true
      ORDER BY p.name, b.base_name
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('Nenhum projeto encontrado.');
      return;
    }
    
    // Agrupar por projeto
    const projetosPorId = {};
    result.rows.forEach(row => {
      if (!projetosPorId[row.projeto_id]) {
        projetosPorId[row.projeto_id] = {
          id: row.projeto_id,
          nome: row.projeto_nome,
          descricao: row.projeto_descricao,
          ativo: row.projeto_ativo,
          bases: []
        };
      }
      
      if (row.base_id) {
        projetosPorId[row.projeto_id].bases.push({
          id: row.base_id,
          nome: row.base_name,
          codigo: row.base_code,
          descricao: row.base_descricao,
          ativa: row.base_ativa
        });
      }
    });
    
    // Exibir relatório
    console.log(`TOTAL DE PROJETOS ATIVOS: ${Object.keys(projetosPorId).length}\n`);
    
    Object.values(projetosPorId).forEach(projeto => {
      console.log(`📋 PROJETO: ${projeto.nome} (ID: ${projeto.id})`);
      if (projeto.descricao) {
        console.log(`   Descrição: ${projeto.descricao}`);
      }
      console.log(`   Total de Bases: ${projeto.bases.length}`);
      
      if (projeto.bases.length > 0) {
        console.log('   Bases:');
        projeto.bases.forEach(base => {
          console.log(`   • ${base.nome} (ID: ${base.id})`);
          if (base.codigo) {
            console.log(`     Código: ${base.codigo}`);
          }
          if (base.descricao) {
            console.log(`     Descrição: ${base.descricao}`);
          }
        });
      } else {
        console.log('   ⚠️  Nenhuma base configurada');
      }
      console.log('');
    });
    
    // Estatísticas
    const totalBases = Object.values(projetosPorId).reduce((sum, projeto) => sum + projeto.bases.length, 0);
    console.log(`\n=== ESTATÍSTICAS ===`);
    console.log(`Total de Projetos: ${Object.keys(projetosPorId).length}`);
    console.log(`Total de Bases: ${totalBases}`);
    
    // Projetos recém-adicionados (com base na nossa sessão atual)
    console.log(`\n=== PROJETOS RECÉM-ADICIONADOS ===`);
    const projetosRecentes = Object.values(projetosPorId).filter(p => 
      p.nome.includes('FULL MELI') || 
      p.nome.includes('XPT') ||
      p.id >= 10 // IDs maiores que 10 são mais recentes
    );
    
    projetosRecentes.forEach(projeto => {
      console.log(`✅ ${projeto.nome} (ID: ${projeto.id}) - ${projeto.bases.length} bases`);
    });
    
  } catch (error) {
    console.error('Erro ao listar projetos e bases:', error);
  } finally {
    await pool.end();
  }
}

async function verificarIntegridadeDados() {
  try {
    console.log('\n=== VERIFICAÇÃO DE INTEGRIDADE ===\n');
    
    // Verificar projetos sem bases
    const projetosSemBases = await pool.query(`
      SELECT p.id, p.name 
      FROM projects p 
      LEFT JOIN project_bases b ON p.id = b.project_id 
      WHERE p.is_active = true AND b.id IS NULL
    `);
    
    if (projetosSemBases.rows.length > 0) {
      console.log('⚠️  PROJETOS SEM BASES:');
      projetosSemBases.rows.forEach(row => {
        console.log(`   • ${row.name} (ID: ${row.id})`);
      });
    } else {
      console.log('✅ Todos os projetos possuem pelo menos uma base');
    }
    
    // Verificar bases inativas
    const basesInativas = await pool.query(`
      SELECT b.base_name, p.name as projeto_nome
      FROM project_bases b
      JOIN projects p ON b.project_id = p.id
      WHERE b.is_active = false AND p.is_active = true
    `);
    
    if (basesInativas.rows.length > 0) {
      console.log('\n⚠️  BASES INATIVAS EM PROJETOS ATIVOS:');
      basesInativas.rows.forEach(row => {
        console.log(`   • ${row.base_name} (Projeto: ${row.projeto_nome})`);
      });
    } else {
      console.log('\n✅ Todas as bases em projetos ativos estão ativas');
    }
    
  } catch (error) {
    console.error('Erro na verificação de integridade:', error);
  }
}

async function main() {
  console.log('Conectando ao banco de dados...');
  await listarTodosProjetosEBases();
  await verificarIntegridadeDados();
  console.log('\n=== DOCUMENTAÇÃO CONCLUÍDA ===');
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  listarTodosProjetosEBases,
  verificarIntegridadeDados
};
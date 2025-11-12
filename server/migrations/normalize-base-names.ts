#!/usr/bin/env tsx
/**
 * Script de migração para normalizar nomes de bases em solicitações de combustível
 * Corrige inconsistências como "PTL02 JUNDIAÍ (PETLOVE)" -> "PTL02_JUNDIA_PETLOVE"
 */

import { pool } from '../db';
import { normalizeBaseName } from '../../shared/baseNormalization';

interface SolicitacaoRow {
  id: number;
  base: string;
}

async function migratBaseNames() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando normalização de nomes de bases...\n');
    
    const result = await client.query<SolicitacaoRow>(`
      SELECT id, base FROM solicitacoes_fuel_card
      WHERE base IS NOT NULL AND base != ''
      ORDER BY id
    `);
    
    console.log(`📊 Total de solicitações encontradas: ${result.rows.length}\n`);
    
    let updateCount = 0;
    let unchangedCount = 0;
    const updates: Array<{id: number, old: string, new: string}> = [];
    
    for (const row of result.rows) {
      const normalized = normalizeBaseName(row.base);
      
      if (normalized !== row.base) {
        updates.push({ id: row.id, old: row.base, new: normalized });
        updateCount++;
      } else {
        unchangedCount++;
      }
    }
    
    console.log(`\n📋 Resumo:`);
    console.log(`   ✅ Solicitações que precisam de atualização: ${updateCount}`);
    console.log(`   ⏭️  Solicitações já normalizadas: ${unchangedCount}\n`);
    
    if (updateCount === 0) {
      console.log('✅ Nenhuma solicitação precisa ser atualizada!');
      return;
    }
    
    console.log('🔧 Atualizando solicitações...\n');
    
    const updatesBatches = groupByBaseName(updates);
    
    await client.query('BEGIN');
    
    let processedCount = 0;
    
    for (const [oldName, updateGroup] of Object.entries(updatesBatches)) {
      const newName = updateGroup[0].new;
      const ids = updateGroup.map(u => u.id);
      
      await client.query(
        `UPDATE solicitacoes_fuel_card 
         SET base = $1 
         WHERE id = ANY($2::int[])`,
        [newName, ids]
      );
      
      processedCount += ids.length;
      console.log(`   ✓ "${oldName}" -> "${newName}" (${ids.length} registros)`);
    }
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Migração concluída com sucesso!`);
    console.log(`   Total atualizado: ${processedCount} solicitações\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

function groupByBaseName(updates: Array<{id: number, old: string, new: string}>): Record<string, Array<{id: number, old: string, new: string}>> {
  const groups: Record<string, Array<{id: number, old: string, new: string}>> = {};
  
  for (const update of updates) {
    if (!groups[update.old]) {
      groups[update.old] = [];
    }
    groups[update.old].push(update);
  }
  
  return groups;
}

migratBaseNames()
  .then(() => {
    console.log('🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na migração:', error);
    process.exit(1);
  });

import { pool } from '../db';
import { normalizeBaseName } from '../../shared/baseNormalization';

/**
 * Migração para normalizar nomes de bases na tabela project_bases
 * 
 * Esta migração:
 * 1. Cria backup de segurança
 * 2. Normaliza base_name usando normalizeBaseName()
 * 3. Resolve duplicatas (mantém o primeiro registro)
 * 4. Verifica integridade dos dados
 */

interface ProjectBase {
  id: number;
  project_id: number;
  base_name: string;
  base_code: string;
  description?: string;
  is_active: boolean;
}

async function normalizeProjectBases() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando normalização de project_bases...\n');
    
    // 1. Criar backup
    console.log('📦 Criando backup de segurança...');
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_bases_backup_${Date.now()} AS 
      SELECT * FROM project_bases
    `);
    
    console.log('✅ Backup criado\n');
    
    // 2. Buscar todos os registros
    console.log('📊 Buscando registros atuais...');
    const result = await client.query<ProjectBase>(`
      SELECT id, project_id, base_name, base_code, description, is_active
      FROM project_bases
      ORDER BY id
    `);
    
    console.log(`📋 Encontrados ${result.rows.length} registros\n`);
    
    // 3. Preparar atualizações
    const updates: { id: number; oldName: string; newName: string }[] = [];
    const duplicates = new Map<string, number[]>();
    
    result.rows.forEach((row: ProjectBase) => {
      const normalized = normalizeBaseName(row.base_name);
      
      if (normalized !== row.base_name) {
        updates.push({
          id: row.id,
          oldName: row.base_name,
          newName: normalized
        });
      }
      
      // Rastrear duplicatas
      if (!duplicates.has(normalized)) {
        duplicates.set(normalized, []);
      }
      duplicates.get(normalized)!.push(row.id);
    });
    
    console.log(`🔄 ${updates.length} registros precisam ser normalizados`);
    console.log('Exemplos de mudanças:');
    updates.slice(0, 5).forEach(u => {
      console.log(`  "${u.oldName}" → "${u.newName}"`);
    });
    console.log('');
    
    // 4. Identificar duplicatas
    const dupsToResolve = Array.from(duplicates.entries())
      .filter(([, ids]) => ids.length > 1);
    
    if (dupsToResolve.length > 0) {
      console.log(`⚠️  ${dupsToResolve.length} duplicatas detectadas após normalização:`);
      dupsToResolve.forEach(([name, ids]) => {
        console.log(`  "${name}": ${ids.length} registros (IDs: ${ids.join(', ')})`);
      });
      console.log('');
      
      // Resolver duplicatas: manter primeiro registro, desativar os demais
      console.log('🔧 Resolvendo duplicatas (desativando registros duplicados)...');
      for (const [name, ids] of dupsToResolve) {
        const [keepId, ...removeIds] = ids;
        
        for (const id of removeIds) {
          await client.query(`
            UPDATE project_bases 
            SET is_active = false,
                description = COALESCE(description, '') || ' [DUPLICATA - Desativado em migração]'
            WHERE id = $1
          `, [id]);
          
          console.log(`  ❌ Desativado registro duplicado ID ${id} (mantendo ID ${keepId})`);
        }
      }
      console.log('');
    }
    
    // 5. Aplicar normalizações
    console.log('✏️  Aplicando normalizações...');
    let updateCount = 0;
    
    for (const update of updates) {
      await client.query(`
        UPDATE project_bases 
        SET base_name = $1
        WHERE id = $2
      `, [update.newName, update.id]);
      
      updateCount++;
      
      if (updateCount % 10 === 0) {
        console.log(`  Processados ${updateCount}/${updates.length}...`);
      }
    }
    
    console.log(`✅ ${updateCount} registros normalizados\n`);
    
    // 6. Verificar resultado
    console.log('🔍 Verificando resultado final...');
    const verification = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT base_name) as unique_names,
        COUNT(*) FILTER (WHERE is_active = true) as active_records
      FROM project_bases
    `);
    
    const stats = verification.rows[0];
    console.log(`📊 Estatísticas finais:`);
    console.log(`  Total de registros: ${stats.total}`);
    console.log(`  Nomes únicos: ${stats.unique_names}`);
    console.log(`  Registros ativos: ${stats.active_records}`);
    console.log('');
    
    // 7. Mostrar exemplos normalizados
    const examples = await client.query(`
      SELECT base_name 
      FROM project_bases 
      WHERE is_active = true
      ORDER BY base_name
      LIMIT 10
    `);
    
    console.log('📝 Exemplos de nomes normalizados:');
    examples.rows.forEach((row: { base_name: string }) => {
      console.log(`  - ${row.base_name}`);
    });
    console.log('');
    
    await client.query('COMMIT');
    console.log('✅ Migração concluída com sucesso!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante migração:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar migração se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  normalizeProjectBases()
    .then(() => {
      console.log('🎉 Processo finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

export default normalizeProjectBases;

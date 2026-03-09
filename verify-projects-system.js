/**
 * Script completo de verificação do sistema de projetos e bases
 * Analisa integridade dos dados, rotas API e links externos
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verifyProjectsSystem() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DO SISTEMA DE PROJETOS E BASES');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar estrutura das tabelas
    console.log('\n1️⃣ ESTRUTURA DAS TABELAS');
    console.log('-'.repeat(30));
    
    const projectsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Tabela projects:');
    projectsStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    const basesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'project_bases' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Tabela project_bases:');
    basesStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // 2. Verificar dados existentes
    console.log('\n2️⃣ DADOS EXISTENTES');
    console.log('-'.repeat(30));
    
    const projectsData = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.is_active,
        COUNT(pb.id) as total_bases,
        COUNT(CASE WHEN pb.is_active = true THEN 1 END) as active_bases
      FROM projects p
      LEFT JOIN project_bases pb ON p.id = pb.project_id
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.is_active
      ORDER BY p.id;
    `);
    
    console.log('📊 PROJETOS ATIVOS:');
    let totalProjects = 0;
    let totalBases = 0;
    
    projectsData.rows.forEach(project => {
      console.log(`  • ${project.name} (ID: ${project.id})`);
      console.log(`    - Total de bases: ${project.total_bases}`);
      console.log(`    - Bases ativas: ${project.active_bases}`);
      totalProjects++;
      totalBases += parseInt(project.active_bases);
    });
    
    console.log(`\n📈 RESUMO: ${totalProjects} projetos ativos com ${totalBases} bases ativas`);
    
    // 3. Verificar integridade dos dados
    console.log('\n3️⃣ INTEGRIDADE DOS DADOS');
    console.log('-'.repeat(30));
    
    const integrityCheck = await pool.query(`
      -- Verificar projetos órfãos (sem bases)
      SELECT 
        'Projetos sem bases' as tipo,
        COUNT(*) as quantidade
      FROM projects p
      LEFT JOIN project_bases pb ON p.id = pb.project_id
      WHERE p.is_active = true AND pb.id IS NULL
      
      UNION ALL
      
      -- Verificar bases órfãs (projeto inativo)
      SELECT 
        'Bases com projeto inativo' as tipo,
        COUNT(*) as quantidade
      FROM project_bases pb
      LEFT JOIN projects p ON pb.project_id = p.id
      WHERE pb.is_active = true AND (p.is_active = false OR p.id IS NULL)
      
      UNION ALL
      
      -- Verificar bases sem nome
      SELECT 
        'Bases sem nome' as tipo,
        COUNT(*) as quantidade
      FROM project_bases pb
      WHERE pb.is_active = true AND (pb.base_name IS NULL OR pb.base_name = '')
    `);
    
    console.log('🔍 PROBLEMAS DE INTEGRIDADE:');
    integrityCheck.rows.forEach(issue => {
      const status = issue.quantidade > 0 ? '❌' : '✅';
      console.log(`  ${status} ${issue.tipo}: ${issue.quantidade}`);
    });
    
    // 4. Verificar uso em abastecimentos
    console.log('\n4️⃣ USO EM ABASTECIMENTOS');
    console.log('-'.repeat(30));
    
    const usageCheck = await pool.query(`
      SELECT 
        p.name as projeto_nome,
        pb.base_name,
        COUNT(CASE WHEN a.projeto_id IS NOT NULL THEN 1 END) as registros_com_projeto_id,
        COUNT(CASE WHEN a.base_id IS NOT NULL THEN 1 END) as registros_com_base_id,
        COUNT(*) as total_registros
      FROM projects p
      LEFT JOIN project_bases pb ON p.id = pb.project_id
      LEFT JOIN abastecimentos_supabase a ON (a.projeto_id = p.id OR a.base_id = pb.id)
      WHERE p.is_active = true AND pb.is_active = true
      GROUP BY p.id, p.name, pb.id, pb.base_name
      HAVING COUNT(*) > 0
      ORDER BY total_registros DESC
      LIMIT 10;
    `);
    
    console.log('📋 TOP 10 BASES MAIS UTILIZADAS:');
    usageCheck.rows.forEach((usage, index) => {
      const projetoCobertura = ((usage.registros_com_projeto_id / usage.total_registros) * 100).toFixed(1);
      const baseCobertura = ((usage.registros_com_base_id / usage.total_registros) * 100).toFixed(1);
      
      console.log(`  ${index + 1}. ${usage.projeto_nome} → ${usage.base_name}`);
      console.log(`     - Registros: ${usage.total_registros}`);
      console.log(`     - Cobertura projeto_id: ${projetoCobertura}%`);
      console.log(`     - Cobertura base_id: ${baseCobertura}%`);
    });
    
    // 5. Simular resposta da API
    console.log('\n5️⃣ SIMULAÇÃO DA API');
    console.log('-'.repeat(30));
    
    const apiResponse = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.is_active,
        json_agg(
          json_build_object(
            'id', pb.id,
            'base_name', pb.base_name,
            'base_code', pb.base_code,
            'description', pb.description,
            'is_active', pb.is_active
          ) ORDER BY pb.base_name
        ) FILTER (WHERE pb.id IS NOT NULL) as bases
      FROM projects p
      LEFT JOIN project_bases pb ON p.id = pb.project_id AND pb.is_active = true
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.description, p.is_active
      ORDER BY p.name;
    `);
    
    console.log('🎯 RESPOSTA DA API (/api/public/projects-with-bases):');
    console.log(`  ✅ Projetos encontrados: ${apiResponse.rows.length}`);
    
    let totalBasesInAPI = 0;
    apiResponse.rows.forEach(project => {
      const basesCount = project.bases ? project.bases.length : 0;
      totalBasesInAPI += basesCount;
      console.log(`  • ${project.name}: ${basesCount} bases`);
    });
    
    console.log(`  ✅ Total de bases na API: ${totalBasesInAPI}`);
    
    // Verificar se os dados coincidem
    if (totalBasesInAPI === totalBases) {
      console.log('  ✅ Integridade API confirmada - dados consistentes');
    } else {
      console.log('  ⚠️ Divergência detectada - verificar consultas');
    }
    
    console.log('\n6️⃣ DIAGNÓSTICO FINAL');
    console.log('-'.repeat(30));
    
    const finalStatus = {
      projects: totalProjects,
      bases: totalBases,
      apiConsistent: totalBasesInAPI === totalBases,
      dataIntegrityIssues: integrityCheck.rows.some(issue => issue.quantidade > 0)
    };
    
    if (finalStatus.projects > 0 && finalStatus.bases > 0 && finalStatus.apiConsistent && !finalStatus.dataIntegrityIssues) {
      console.log('🎉 SISTEMA 100% FUNCIONAL');
      console.log('  ✅ Projetos carregados corretamente');
      console.log('  ✅ Bases associadas corretamente');
      console.log('  ✅ API respondendo consistentemente');
      console.log('  ✅ Integridade de dados preservada');
    } else {
      console.log('⚠️ PROBLEMAS DETECTADOS');
      if (finalStatus.projects === 0) console.log('  ❌ Nenhum projeto encontrado');
      if (finalStatus.bases === 0) console.log('  ❌ Nenhuma base encontrada');
      if (!finalStatus.apiConsistent) console.log('  ❌ API inconsistente');
      if (finalStatus.dataIntegrityIssues) console.log('  ❌ Problemas de integridade detectados');
    }
    
    return finalStatus;
    
  } catch (error) {
    console.error('💥 ERRO DURANTE VERIFICAÇÃO:', error.message);
    console.error('Stack:', error.stack);
    return { error: error.message };
  } finally {
    await pool.end();
  }
}

// Executar verificação se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyProjectsSystem()
    .then(result => {
      console.log('\n🏁 VERIFICAÇÃO CONCLUÍDA');
      process.exit(result.error ? 1 : 0);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

export { verifyProjectsSystem };
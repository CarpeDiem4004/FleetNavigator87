const XLSX = require('xlsx');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function insertBasesFromExcel() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando processamento de bases...\n');
    
    // Ler arquivo Excel
    const workbook = XLSX.readFile('attached_assets/bases atualizadas_1759969586116.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Total de bases no arquivo Excel: ${data.length}`);
    
    // Buscar bases existentes
    const existingResult = await client.query('SELECT name FROM bases');
    const existingNames = new Set(existingResult.rows.map(r => r.name.trim()));
    console.log(`🏢 Bases existentes no banco: ${existingNames.size}\n`);
    
    // Buscar projetos
    const projectsResult = await client.query('SELECT id, name FROM projects');
    const projectMap = {};
    projectsResult.rows.forEach(p => {
      projectMap[p.name] = p.id;
      projectMap[p.name.toLowerCase()] = p.id;
      projectMap[p.name.toUpperCase()] = p.id;
    });
    
    console.log(`📦 Projetos disponíveis: ${projectsResult.rows.length}\n`);
    
    const newBases = [];
    const alreadyExists = [];
    
    // Processar cada base do Excel
    for (const row of data) {
      const baseName = (row.Bases || row.BASE || row.base || '').trim();
      const projectName = (row.Projeto || row.PROJETO || row.projeto || '').trim();
      
      if (!baseName) continue;
      
      if (existingNames.has(baseName)) {
        alreadyExists.push(baseName);
      } else {
        const projectId = projectName ? (projectMap[projectName] || null) : null;
        const basename = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        
        newBases.push({
          name: baseName,
          project_id: projectId,
          basename: basename,
          type: 'base',
          operation: 'logistica',
          active: true,
          has_maintenance: false,
          has_tires: false,
          requests_enabled: true
        });
      }
    }
    
    console.log(`✅ Bases novas a serem inseridas: ${newBases.length}`);
    console.log(`⏭️  Bases que já existem: ${alreadyExists.length}\n`);
    
    // Inserir bases novas
    if (newBases.length > 0) {
      console.log('🔄 Inserindo bases...\n');
      
      let insertedCount = 0;
      for (const base of newBases) {
        try {
          await client.query(
            `INSERT INTO bases (name, project_id, basename, type, operation, active, has_maintenance, has_tires, requests_enabled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [base.name, base.project_id, base.basename, base.type, base.operation, base.active, base.has_maintenance, base.has_tires, base.requests_enabled]
          );
          insertedCount++;
          console.log(`  ✓ ${insertedCount}. ${base.name}`);
        } catch (err) {
          console.error(`  ✗ Erro ao inserir ${base.name}:`, err.message);
        }
      }
      
      console.log(`\n🎉 ${insertedCount} bases inseridas com sucesso!`);
    } else {
      console.log('✨ Nenhuma base nova para inserir.');
    }
    
    if (alreadyExists.length > 0) {
      console.log(`\n📌 Bases que já existiam (${alreadyExists.length} - não modificadas):`);
      alreadyExists.slice(0, 10).forEach(name => console.log(`   - ${name}`));
      if (alreadyExists.length > 10) {
        console.log(`   ... e mais ${alreadyExists.length - 10} bases`);
      }
    }
    
    console.log('\n✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

insertBasesFromExcel();

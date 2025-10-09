const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function processBasesFromExcel() {
  try {
    console.log('🚀 Iniciando processamento de bases...\n');
    
    // Ler arquivo Excel
    const workbook = XLSX.readFile('attached_assets/bases atualizadas_1759969586116.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Total de bases no arquivo Excel: ${data.length}`);
    console.log('📋 Estrutura do Excel (primeiras 3 linhas):');
    console.log(JSON.stringify(data.slice(0, 3), null, 2));
    
    // Buscar projetos existentes
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, name');
    
    if (projectError) {
      console.error('❌ Erro ao buscar projetos:', projectError);
      return;
    }
    
    console.log(`\n📦 Projetos disponíveis: ${projects.length}`);
    
    // Criar mapa de projetos
    const projectMap = {};
    projects.forEach(p => {
      projectMap[p.name] = p.id;
      projectMap[p.name.toLowerCase()] = p.id;
      projectMap[p.name.toUpperCase()] = p.id;
    });
    
    // Buscar bases existentes
    const { data: existingBases, error: fetchError } = await supabase
      .from('bases')
      .select('name');
    
    if (fetchError) {
      console.error('❌ Erro ao buscar bases existentes:', fetchError);
      return;
    }
    
    const existingNames = new Set(existingBases.map(b => b.name.trim()));
    console.log(`🏢 Bases existentes no banco: ${existingNames.size}`);
    
    const newBases = [];
    const alreadyExists = [];
    
    // Processar cada base do Excel
    for (const row of data) {
      const baseName = (row.Bases || row.BASE || row.base || row.Nome || row.nome || row.NOME || row['Nome da Base'] || '').trim();
      const projectName = (row.Projeto || row.PROJETO || row.projeto || row.Project || row.PROJECT || '').trim();
      
      if (!baseName) continue;
      
      if (existingNames.has(baseName)) {
        alreadyExists.push(baseName);
      } else {
        const projectId = projectName ? (projectMap[projectName] || projectMap[projectName.toLowerCase()] || projectMap[projectName.toUpperCase()] || null) : null;
        
        newBases.push({
          name: baseName,
          project_id: projectId,
          active: true,
          basename: baseName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
          type: 'base',
          operation: 'logistica',
          has_maintenance: false,
          has_tires: false,
          requests_enabled: true
        });
      }
    }
    
    console.log(`\n✅ Bases novas a serem inseridas: ${newBases.length}`);
    console.log(`⏭️  Bases que já existem: ${alreadyExists.length}`);
    
    // Inserir bases novas
    if (newBases.length > 0) {
      console.log('\n🔄 Inserindo bases...');
      const { data: inserted, error: insertError } = await supabase
        .from('bases')
        .insert(newBases)
        .select();
      
      if (insertError) {
        console.error('❌ Erro ao inserir bases:', insertError);
      } else {
        console.log(`\n🎉 ${inserted.length} bases inseridas com sucesso!`);
        console.log('\n📝 Bases inseridas:');
        newBases.forEach((b, i) => console.log(`   ${i+1}. ${b.name}`));
      }
    } else {
      console.log('\n✨ Nenhuma base nova para inserir.');
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
  }
}

processBasesFromExcel();

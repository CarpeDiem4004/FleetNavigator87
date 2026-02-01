const XLSX = require('xlsx');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função para criar chave de busca simplificada (remove tudo exceto letras/números)
function createSearchKey(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

async function updateVehicleBases() {
  console.log('=== ATUALIZAÇÃO DE BASE DOS VEÍCULOS ===\n');
  
  // Ler a planilha Excel
  const workbook = XLSX.readFile('attached_assets/frota_base_1769960943698.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`📊 Total de linhas na planilha: ${data.length}`);
  console.log(`📋 Colunas encontradas: ${Object.keys(data[0] || {}).join(', ')}\n`);
  
  // Buscar todas as bases do banco
  const basesResult = await pool.query('SELECT id, name FROM bases');
  const basesSearchMap = new Map();     // Chave simplificada -> { id, name }
  
  basesResult.rows.forEach(base => {
    const searchKey = createSearchKey(base.name);
    basesSearchMap.set(searchKey, { id: base.id, name: base.name });
  });
  console.log(`🏢 Total de bases no banco: ${basesSearchMap.size}\n`);
  
  // Buscar todas as placas do banco
  const veiculosResult = await pool.query('SELECT id, placa, base_id FROM veiculos');
  const veiculosMap = new Map();
  veiculosResult.rows.forEach(v => {
    const normalizedPlaca = v.placa?.trim().toUpperCase().replace(/-/g, '');
    if (normalizedPlaca) {
      veiculosMap.set(normalizedPlaca, { id: v.id, base_id: v.base_id, placa_original: v.placa });
    }
  });
  console.log(`🚗 Total de veículos no banco: ${veiculosMap.size}\n`);
  
  // Contadores
  let atualizados = 0;
  let placasNaoEncontradas = [];
  let basesNaoEncontradas = [];
  let erros = [];
  let semAlteracao = 0;
  let processados = 0;
  
  // Processar cada linha da planilha
  for (const row of data) {
    const placaCol = Object.keys(row).find(k => k.toUpperCase() === 'PLACA');
    const baseCol = Object.keys(row).find(k => k.toUpperCase() === 'BASE');
    
    if (!placaCol || !baseCol) {
      continue;
    }
    
    const placaRaw = row[placaCol];
    const baseRaw = row[baseCol];
    
    if (!placaRaw || String(placaRaw).trim() === '') {
      erros.push({ placa: placaRaw, base: baseRaw, erro: 'Placa vazia' });
      continue;
    }
    
    if (!baseRaw || String(baseRaw).trim() === '') {
      erros.push({ placa: placaRaw, base: baseRaw, erro: 'Base vazia' });
      continue;
    }
    
    const placaNormalizada = String(placaRaw).trim().toUpperCase().replace(/-/g, '');
    const baseNome = String(baseRaw).trim();
    const baseSearchKey = createSearchKey(baseNome);
    
    processados++;
    
    // Verificar se a placa existe no banco
    const veiculo = veiculosMap.get(placaNormalizada);
    if (!veiculo) {
      placasNaoEncontradas.push({ placa: placaRaw, base: baseNome });
      continue;
    }
    
    // Buscar base pela chave simplificada
    const baseInfo = basesSearchMap.get(baseSearchKey);
    if (!baseInfo) {
      basesNaoEncontradas.push({ placa: placaRaw, base: baseNome, searchKey: baseSearchKey });
      continue;
    }
    
    // Verificar se já está com a base correta
    if (veiculo.base_id === baseInfo.id) {
      semAlteracao++;
      continue;
    }
    
    // Atualizar o veículo
    try {
      await pool.query(
        'UPDATE veiculos SET base_id = $1, updated_at = NOW() WHERE id = $2',
        [baseInfo.id, veiculo.id]
      );
      atualizados++;
    } catch (err) {
      erros.push({ placa: placaRaw, base: baseNome, erro: err.message });
    }
  }
  
  // Relatório final
  console.log('\n=== RELATÓRIO FINAL ===\n');
  console.log(`📊 Total processados: ${processados}`);
  console.log(`✅ Veículos atualizados: ${atualizados}`);
  console.log(`⏭️ Sem alteração (já corretos): ${semAlteracao}`);
  console.log(`❌ Placas não encontradas: ${placasNaoEncontradas.length}`);
  console.log(`🏢 Bases não encontradas: ${basesNaoEncontradas.length}`);
  console.log(`⚠️ Erros: ${erros.length}`);
  
  if (placasNaoEncontradas.length > 0) {
    console.log('\n📋 PLACAS NÃO ENCONTRADAS NO BANCO:');
    placasNaoEncontradas.forEach(p => console.log(`   - ${p.placa} (base: ${p.base})`));
  }
  
  if (basesNaoEncontradas.length > 0) {
    console.log('\n🏢 BASES NÃO ENCONTRADAS NO BANCO:');
    const uniqueBases = [...new Map(basesNaoEncontradas.map(b => [b.base, b])).values()];
    uniqueBases.forEach(b => console.log(`   - "${b.base}" (chave: ${b.searchKey})`));
  }
  
  if (erros.length > 0) {
    console.log('\n⚠️ ERROS:');
    erros.forEach(e => console.log(`   - Placa: ${e.placa}, Base: ${e.base}, Erro: ${e.erro}`));
  }
  
  await pool.end();
  console.log('\n=== FIM ===');
}

updateVehicleBases().catch(console.error);

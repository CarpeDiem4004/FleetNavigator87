const XLSX = require('xlsx');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function createSearchKey(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

async function updateVehicleBases() {
  console.log('=== ATUALIZAÇÃO DE BASE DOS VEÍCULOS (CORRIGIDO) ===\n');
  
  const workbook = XLSX.readFile('attached_assets/frota_base_1769960943698.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`📊 Total de linhas na planilha: ${data.length}`);
  console.log(`📋 Colunas encontradas: ${Object.keys(data[0] || {}).join(', ')}\n`);
  
  const basesResult = await pool.query('SELECT id, name FROM bases');
  const basesSearchMap = new Map();
  
  basesResult.rows.forEach(base => {
    const searchKey = createSearchKey(base.name);
    basesSearchMap.set(searchKey, { id: base.id, name: base.name });
  });
  console.log(`🏢 Total de bases no banco: ${basesSearchMap.size}`);
  console.log('Bases disponíveis (chave simplificada):');
  [...basesSearchMap.entries()].slice(0, 10).forEach(([k, v]) => console.log(`  ${k} -> ${v.name} (id: ${v.id})`));
  console.log('...\n');
  
  const veiculosResult = await pool.query('SELECT id, plate, base_id FROM vehicles');
  const veiculosMap = new Map();
  veiculosResult.rows.forEach(v => {
    const normalizedPlaca = v.plate?.trim().toUpperCase().replace(/-/g, '');
    if (normalizedPlaca) {
      veiculosMap.set(normalizedPlaca, { id: v.id, base_id: v.base_id, placa_original: v.plate });
    }
  });
  console.log(`🚗 Total de veículos no banco: ${veiculosMap.size}\n`);
  
  let atualizados = 0;
  let placasNaoEncontradas = [];
  let basesNaoEncontradas = [];
  let erros = [];
  let semAlteracao = 0;
  let processados = 0;
  
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
    
    const veiculo = veiculosMap.get(placaNormalizada);
    if (!veiculo) {
      placasNaoEncontradas.push({ placa: placaRaw, base: baseNome });
      continue;
    }
    
    const baseInfo = basesSearchMap.get(baseSearchKey);
    if (!baseInfo) {
      basesNaoEncontradas.push({ placa: placaRaw, base: baseNome, searchKey: baseSearchKey });
      continue;
    }
    
    if (veiculo.base_id === baseInfo.id) {
      semAlteracao++;
      continue;
    }
    
    try {
      await pool.query(
        'UPDATE vehicles SET base_id = $1, updated_at = NOW() WHERE id = $2',
        [baseInfo.id, veiculo.id]
      );
      atualizados++;
      if (atualizados <= 5) {
        console.log(`✅ Atualizado: ${placaRaw} -> ${baseInfo.name} (id: ${baseInfo.id})`);
      }
    } catch (err) {
      erros.push({ placa: placaRaw, base: baseNome, erro: err.message });
    }
  }
  
  console.log('\n=== RESUMO ===');
  console.log(`📝 Total processados: ${processados}`);
  console.log(`✅ Atualizados: ${atualizados}`);
  console.log(`⏭️ Sem alteração (já corretos): ${semAlteracao}`);
  console.log(`❌ Placas não encontradas: ${placasNaoEncontradas.length}`);
  console.log(`⚠️ Bases não encontradas: ${basesNaoEncontradas.length}`);
  console.log(`🔴 Erros: ${erros.length}`);
  
  if (basesNaoEncontradas.length > 0) {
    console.log('\n=== BASES NÃO ENCONTRADAS ===');
    const basesUnicas = [...new Set(basesNaoEncontradas.map(b => b.base))];
    basesUnicas.forEach(b => {
      const count = basesNaoEncontradas.filter(x => x.base === b).length;
      console.log(`  - "${b}" (${count} veículos)`);
    });
  }
  
  if (placasNaoEncontradas.length > 0 && placasNaoEncontradas.length <= 20) {
    console.log('\n=== PLACAS NÃO ENCONTRADAS ===');
    placasNaoEncontradas.forEach(p => console.log(`  - ${p.placa}`));
  } else if (placasNaoEncontradas.length > 20) {
    console.log(`\n=== PLACAS NÃO ENCONTRADAS (primeiras 20 de ${placasNaoEncontradas.length}) ===`);
    placasNaoEncontradas.slice(0, 20).forEach(p => console.log(`  - ${p.placa}`));
  }
  
  await pool.end();
}

updateVehicleBases().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});

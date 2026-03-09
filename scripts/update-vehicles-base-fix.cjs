const XLSX = require('xlsx');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Mapeamento manual das bases com nomes diferentes
const BASE_MAPPING = {
  'GP02JACAREI': 215,           // GP02 JACAREI (GRUPO PEREIRA)
  'GP03HORTOLANDIA': 216,       // GP03 HORTOLANDIA (GRUPO PEREIRA)
  'ROYALCANINCAMPINASMARS': 155, // ROYAL CANIN CAMPINAS
  'SCPOCOSDECALDASSMG5': 115,   // SC (POÇOS DE CALDAS) SMG5
  'SCVITORIASES1SDD': 130,      // SC (VITÓRIA) SES1-SDD
  'XPTIVAIPORAEPR13': 225,      // XPT Ivaiporã EPR13
};

function createSearchKey(name) {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function updateRemainingVehicles() {
  console.log('=== ATUALIZAÇÃO COMPLEMENTAR (MAPEAMENTO MANUAL) ===\n');
  
  const workbook = XLSX.readFile('attached_assets/frota_base_1769960943698.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Buscar todas as placas do banco
  const veiculosResult = await pool.query('SELECT id, placa, base_id FROM veiculos');
  const veiculosMap = new Map();
  veiculosResult.rows.forEach(v => {
    const normalizedPlaca = v.placa?.trim().toUpperCase().replace(/-/g, '');
    if (normalizedPlaca) {
      veiculosMap.set(normalizedPlaca, { id: v.id, base_id: v.base_id });
    }
  });
  
  let atualizados = 0;
  let naoEncontradas = [];
  
  for (const row of data) {
    const placaCol = Object.keys(row).find(k => k.toUpperCase() === 'PLACA');
    const baseCol = Object.keys(row).find(k => k.toUpperCase() === 'BASE');
    
    if (!placaCol || !baseCol) continue;
    
    const placaRaw = row[placaCol];
    const baseRaw = row[baseCol];
    
    if (!placaRaw || !baseRaw) continue;
    
    const placaNormalizada = String(placaRaw).trim().toUpperCase().replace(/-/g, '');
    const baseSearchKey = createSearchKey(String(baseRaw));
    
    // Verificar se a base precisa de mapeamento manual
    const baseId = BASE_MAPPING[baseSearchKey];
    if (!baseId) continue; // Pula se não está no mapeamento manual
    
    const veiculo = veiculosMap.get(placaNormalizada);
    if (!veiculo) {
      naoEncontradas.push({ placa: placaRaw, base: baseRaw });
      continue;
    }
    
    // Atualizar
    if (veiculo.base_id !== baseId) {
      await pool.query(
        'UPDATE veiculos SET base_id = $1, updated_at = NOW() WHERE id = $2',
        [baseId, veiculo.id]
      );
      atualizados++;
      console.log(`✅ ${placaRaw} -> base_id: ${baseId}`);
    }
  }
  
  console.log(`\n=== RESULTADO ===`);
  console.log(`✅ Atualizados: ${atualizados}`);
  console.log(`❌ Placas não encontradas: ${naoEncontradas.length}`);
  
  if (naoEncontradas.length > 0) {
    console.log('\nPlacas não encontradas:');
    naoEncontradas.forEach(p => console.log(`   - ${p.placa}`));
  }
  
  await pool.end();
}

updateRemainingVehicles().catch(console.error);

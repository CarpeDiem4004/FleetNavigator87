/**
 * Script para cadastrar todos os veículos do Line Hall Shopee
 * Baseado na lista fornecida na imagem
 */

const vehicles = [
  { model: "Mercedes", plate: "SYH6260", card: "SDG2353" },
  { model: "Volvo", plate: "STH6274", card: "RMC8819" },
  { model: "Mercedes", plate: "SWJ6256", card: "SWJ6256" },
  { model: "Mercedes", plate: "SY96310", card: "SWJ6610" },
  { model: "Volvo", plate: "STY3464", card: "SDG3367" },
  { model: "Volvo", plate: "SYH8283", card: "RMO2439" },
  { model: "Volkswagen Constellation", plate: "FNU8854", card: "FNU8854" },
  { model: "Volvo", plate: "SWI2315", card: "SWI2501" },
  { model: "Volkswagen Constellation", plate: "FLN6165", card: "SWG5157" },
  { model: "Volvo", plate: "QFT3470", card: "SWM3630" },
  { model: "Volvo", plate: "SSQ3557", card: "RNB8848" },
  { model: "Volvo", plate: "SYG3348", card: "RNG2939" },
  { model: "Volkswagen Constellation", plate: "FVY2806", card: "QPC3681" },
  { model: "Mercedes", plate: "SWY1108", card: "SWY1108" },
  { model: "Iveco", plate: "FLA5335", card: "RRM1021" },
  { model: "Volkswagen Constellation", plate: "GKB5556", card: "GKB5556" },
  { model: "Volvo", plate: "STQ7605", card: "STQ7606" },
  { model: "Volvo", plate: "GSB5809", card: "FHD0551" },
  { model: "Volkswagen Constellation", plate: "FDP9554", card: "SWG5027" },
  { model: "Mercedes", plate: "TME3867", card: "SDG3105" },
  { model: "Volvo", plate: "SWG9322", card: "RLH5398" },
  { model: "Volkswagen Constellation", plate: "FAZ7531", card: "RNJ6565" },
  { model: "Volvo", plate: "GKC1950", card: "SWN5631" },
  { model: "Volvo", plate: "SYQ6157", card: "RNJ3516" },
  { model: "Volkswagen Constellation", plate: "FZF3646", card: "SWH8570" },
  { model: "Volvo", plate: "FQA3837", card: "RNR2528" },
  { model: "Volvo", plate: "SWR6425", card: "RNS3935" },
  { model: "Volvo", plate: "SYH6887", card: "RME3107" },
  { model: "Volvo", plate: "SST5795", card: "RMJ2140" },
  { model: "Volvo", plate: "SSU5906", card: "RNJ4306" },
  { model: "Volvo", plate: "QPG4831", card: "QPC4058" },
  { model: "Volvo", plate: "SWS6395", card: "RVL4056" },
  { model: "Volkswagen Constellation", plate: "SWM5531", card: "RNB3662" },
  { model: "Volvo", plate: "STQ4924", card: "RNJ9672" },
  { model: "Volvo", plate: "FQA7674", card: "FQA7674" },
  { model: "Volkswagen Constellation", plate: "FQU5181", card: "GYS8072" },
  { model: "Volvo", plate: "SSU5906", card: "RNS4100" },
  { model: "Man", plate: "GSF5F56", card: "GFM5444" },
  { model: "Volvo", plate: "SUR5635", card: "RNS4835" },
  { model: "Mercedes", plate: "TLN5197", card: "RUG7556" },
  { model: "Volkswagen Constellation", plate: "FVG", card: "SWN2360" },
  { model: "Mercedes", plate: "STU6520", card: "FQP5264" },
  { model: "Volvo", plate: "FQI9372", card: "RUV3100" },
  { model: "Volvo", plate: "STT8D28", card: "SWG5035" },
  { model: "Volvo", plate: "STQ9F05", card: "SUQ2500" },
  { model: "Volkswagen Constellation", plate: "FRM8125", card: "RNJ9820" },
  { model: "Mercedes", plate: "QMK8556", card: "QMK8556" },
  { model: "Volvo", plate: "FLR8177", card: "SUQ2560" },
  { model: "Mercedes", plate: "SWR5644", card: "SWR5644" },
  { model: "Mercedes", plate: "SUR7634", card: "SDG3119" },
  { model: "Iveco", plate: "GKB5118", card: "QFR5718" },
  { model: "Mercedes", plate: "SWI9125", card: "SWF1525" },
  { model: "Volvo", plate: "FYN2495", card: "SWF2753" },
  { model: "Volvo", plate: "SSU5906", card: "RUV3633" },
  { model: "Volkswagen Constellation", plate: "FAZ7531", card: "SWG4556" },
  { model: "Volkswagen Constellation", plate: "FZF3646", card: "SWA8376" },
  { model: "Volvo", plate: "STT8H25", card: "SWD8308" },
  { model: "Volkswagen Constellation", plate: "FWI1552", card: "FWI1552" },
  { model: "Volvo", plate: "QPG4831", card: "RNJ3839" },
  { model: "Volvo", plate: "SWG9322", card: "SJQ0657" },
  { model: "Volkswagen Constellation", plate: "QHG5443", card: "QHG5443" },
  { model: "Volvo", plate: "SWG9322", card: "SWG9322" },
  { model: "Volvo", plate: "GTE5637", card: "RNS8377" },
  { model: "Volvo", plate: "SWU2361", card: "SWU2361" },
  { model: "Volvo", plate: "SLK7834", card: "SLK7834" },
  { model: "Volkswagen Constellation", plate: "FNY2856", card: "QFC3681" }
];

async function registerVehicle(vehicleData) {
  try {
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plate: vehicleData.plate,
        model: vehicleData.model,
        make: vehicleData.model.includes('Volkswagen') ? 'Volkswagen' : vehicleData.model, // Separar marca do modelo
        vehicleType: 'cavalo_mecanico', // Todos são cavalos mecânicos
        year: 2020, // Ano padrão
        fuelType: 'diesel',
        mediaConsumoCombutivel: getConsumptionByBrand(vehicleData.model),
        status: 'em_operacao',
        baseId: 3, // Line Hall Shopee
        ownership: 'murici',
        rentalCompany: null,
        crlvUrl: null,
        anttUrl: null,
        cartaoAbastecimento: vehicleData.card
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✓ Veículo ${vehicleData.plate} (${vehicleData.model}) cadastrado com sucesso - Cartão: ${vehicleData.card}`);
    return result;
  } catch (error) {
    console.error(`✗ Erro ao cadastrar veículo ${vehicleData.plate}:`, error.message);
    return null;
  }
}

function getConsumptionByBrand(model) {
  if (model.includes('Mercedes')) return 2.5;
  if (model.includes('Volvo')) return 2.7;
  if (model.includes('Volkswagen')) return 2.6;
  if (model.includes('Man')) return 2.6;
  if (model.includes('Iveco')) return 2.4;
  return 2.5; // Padrão
}

async function registerAllVehicles() {
  console.log(`Iniciando cadastro de ${vehicles.length} veículos Line Hall...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    console.log(`\n[${i + 1}/${vehicles.length}] Cadastrando: ${vehicle.plate} - ${vehicle.model}`);
    
    const result = await registerVehicle(vehicle);
    if (result) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Pequena pausa entre cadastros para não sobrecarregar o servidor
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n=== RESUMO DO CADASTRO ===`);
  console.log(`✓ Sucessos: ${successCount}`);
  console.log(`✗ Erros: ${errorCount}`);
  console.log(`📊 Total: ${vehicles.length}`);
}

// Executar o cadastro
registerAllVehicles();
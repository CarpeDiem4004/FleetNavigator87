const XLSX = require('xlsx');
const path = require('path');

console.log('Testando processamento da planilha MercadoLivre...');

try {
  // Caminho para o arquivo Excel
  const filePath = path.join(__dirname, 'attached_assets', 'Rel_MercadoLivre_04082025_112253_1754319412905.xlsx');
  
  // Ler o arquivo Excel
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Usar header: 1 para obter array de arrays
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Primeira linha são os cabeçalhos
  const headers = jsonData[0];
  const dataRows = jsonData.slice(1);
  
  console.log('📋 Cabeçalhos:', headers);
  console.log('📊 Total de linhas de dados:', dataRows.length);
  
  // Processar as primeiras 5 linhas
  console.log('\n🔍 Processamento das primeiras 5 linhas:');
  
  for (let i = 0; i < Math.min(5, dataRows.length); i++) {
    const row = dataRows[i];
    const dataFrete = row[0];
    const operacao = row[1];
    const motorista = row[2];
    const placa = row[3];
    const modelo = row[4];
    
    // Converter data do Excel
    let dataFormatada = '';
    if (dataFrete && typeof dataFrete === 'number') {
      const excelEpoch = new Date(1900, 0, 1);
      const dataConvertida = new Date(excelEpoch.getTime() + (dataFrete - 2) * 24 * 60 * 60 * 1000);
      dataFormatada = dataConvertida.toISOString().split('T')[0];
    }
    
    const processedRow = {
      data: dataFormatada,
      placa: placa ? placa.toString().trim().replace(/[^A-Z0-9]/g, '').toUpperCase() : '',
      motorista: motorista ? motorista.toString().trim() : '',
      operacao: operacao ? operacao.toString().trim() : '',
      modelo: modelo ? modelo.toString().trim() : '',
    };
    
    console.log(`Linha ${i + 2}:`);
    console.log(`  Data original: ${dataFrete} -> Formatada: ${processedRow.data}`);
    console.log(`  Placa: ${processedRow.placa}`);
    console.log(`  Motorista: ${processedRow.motorista.substring(0, 30)}...`);
    console.log(`  Operação: ${processedRow.operacao}`);
    console.log(`  Modelo: ${processedRow.modelo}`);
    console.log('---');
  }
  
  // Contar dados válidos
  let validCount = 0;
  for(const row of dataRows) {
    const dataFrete = row[0];
    const placa = row[3];
    const motorista = row[2];
    
    if (dataFrete && placa && motorista) {
      validCount++;
    }
  }
  
  console.log(`\n✅ Dados válidos: ${validCount} de ${dataRows.length} (${((validCount/dataRows.length)*100).toFixed(1)}%)`);
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
const XLSX = require('xlsx');
const path = require('path');

console.log('Analisando a planilha de modelo...');

try {
  // Caminho para o arquivo Excel
  const filePath = path.join(__dirname, 'attached_assets', 'Rel_MercadoLivre_04082025_112253_1754319412905.xlsx');
  
  // Ler o arquivo Excel
  const workbook = XLSX.readFile(filePath);
  
  // Obter nomes das planilhas
  const sheetNames = workbook.SheetNames;
  console.log('📋 Planilhas encontradas:', sheetNames);
  
  // Analisar a primeira planilha
  const firstSheet = workbook.Sheets[sheetNames[0]];
  
  // Converter para JSON para análise
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  
  console.log('\n📊 Estrutura da planilha:');
  console.log('Número de linhas:', jsonData.length);
  
  if (jsonData.length > 0) {
    console.log('\n🏷️ Cabeçalhos (primeira linha):');
    console.log(jsonData[0]);
    
    console.log('\n📝 Exemplo de dados (primeiras 3 linhas):');
    for (let i = 0; i < Math.min(3, jsonData.length); i++) {
      console.log(`Linha ${i + 1}:`, jsonData[i]);
    }
    
    // Verificar campos esperados
    const headers = jsonData[0] || [];
    const expectedFields = ['data', 'placa', 'motorista', 'operacao', 'modelo'];
    
    console.log('\n🔍 Verificação de campos esperados:');
    expectedFields.forEach(field => {
      const found = headers.some(header => 
        header && header.toString().toLowerCase().includes(field.toLowerCase())
      );
      console.log(`${field}: ${found ? '✅ Encontrado' : '❌ Não encontrado'}`);
    });
    
    console.log('\n📋 Todos os cabeçalhos encontrados:');
    headers.forEach((header, index) => {
      console.log(`Coluna ${index + 1}: "${header}"`);
    });
  }
  
} catch (error) {
  console.error('❌ Erro ao analisar planilha:', error.message);
}
// Teste para verificar inserção no Supabase
import { createClient } from '@supabase/supabase-js';

// Valores padrão para desenvolvimento
const SUPABASE_URL = 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
// Usando a chave do .env para garantir que funcione
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5ODIwNiwiZXhwIjoyMDYwMjc0MjA2fQ.bvwwqQBQVUOlyHYMsX9C5dSQhsQYI2r8qmqRBHgG_0Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Teste 1: Consultar dados
async function testQuery() {
  try {
    console.log('Executando consulta na tabela abastecimentos_postos...');
    const { data, error } = await supabase
      .from('abastecimentos_postos')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Erro na consulta:', error);
    } else {
      console.log('Dados recuperados:', data);
      
      // Listar colunas
      if (data && data.length > 0) {
        console.log('Colunas disponíveis:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.error('Exceção na consulta:', e);
  }
}

// Teste 2: Inserir dados
async function testInsert() {
  try {
    console.log('Testando inserção na tabela abastecimentos_postos...');
    
    const testData = {
      placa: 'TST1234',
      km_atual: 12345,
      tipo_combustivel: 'Diesel',
      litros: 50,
      nome_motorista: 'Teste Driver',
      nome_operador: 'Teste Operator',
      posto: 'Teste',
      project: 'TESTE',
      motorista_rg: '12345678'
    };
    
    const { data, error } = await supabase
      .from('abastecimentos_postos')
      .insert([testData])
      .select();
      
    if (error) {
      console.error('Erro na inserção:', error);
    } else {
      console.log('Dados inseridos com sucesso:', data);
    }
  } catch (e) {
    console.error('Exceção na inserção:', e);
  }
}

async function run() {
  await testQuery();
  await testInsert();
}

run();
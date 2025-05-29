/**
 * Script para atualizar a tabela de veículos com os novos campos necessários
 * - Adiciona campos: make, year, fuel_type, media_consumo_combustivel
 * - Corrige problemas de nomenclatura de colunas
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDk5NDc0MywiZXhwIjoyMDMwNTcwNzQzfQ.kKiVJr5kY2LiP0BqGUE6u_2xeQZX2gVwmkfF8zojlNY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(query, description) {
  try {
    console.log(`\n📊 ${description}`);
    console.log(`SQL: ${query}`);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      return false;
    }
    
    console.log(`✅ ${description} - Executado com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error.message);
    return false;
  }
}

async function checkTableStructure() {
  try {
    console.log('\n🔍 Verificando estrutura atual da tabela veiculos...');
    
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'veiculos')
      .order('ordinal_position');
    
    if (error) {
      console.error('❌ Erro ao verificar estrutura:', error.message);
      return;
    }
    
    console.log('📋 Colunas existentes:');
    data.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message);
  }
}

async function updateVehiclesTable() {
  console.log('🚀 Iniciando atualização da tabela de veículos...');
  
  // Verificar estrutura atual
  await checkTableStructure();
  
  // SQL para adicionar os novos campos
  const queries = [
    {
      sql: `
        ALTER TABLE veiculos 
        ADD COLUMN IF NOT EXISTS make VARCHAR(100);
      `,
      description: 'Adicionando coluna make (marca)'
    },
    {
      sql: `
        ALTER TABLE veiculos 
        ADD COLUMN IF NOT EXISTS year INTEGER;
      `,
      description: 'Adicionando coluna year (ano)'
    },
    {
      sql: `
        ALTER TABLE veiculos 
        ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50) DEFAULT 'Diesel';
      `,
      description: 'Adicionando coluna fuel_type (tipo de combustível)'
    },
    {
      sql: `
        ALTER TABLE veiculos 
        ADD COLUMN IF NOT EXISTS media_consumo_combustivel NUMERIC(5,2);
      `,
      description: 'Adicionando coluna media_consumo_combustivel (média de consumo)'
    },
    {
      sql: `
        -- Adicionar coluna model se não existir (para compatibilidade)
        ALTER TABLE veiculos 
        ADD COLUMN IF NOT EXISTS model VARCHAR(100);
      `,
      description: 'Adicionando coluna model (para compatibilidade)'
    },
    {
      sql: `
        -- Copiar dados da coluna modelo para model se existir
        UPDATE veiculos 
        SET model = modelo 
        WHERE modelo IS NOT NULL AND (model IS NULL OR model = '');
      `,
      description: 'Copiando dados de modelo para model'
    },
    {
      sql: `
        -- Atualizar veículos existentes com valores padrão
        UPDATE veiculos 
        SET 
          fuel_type = COALESCE(fuel_type, 'Diesel'),
          make = COALESCE(make, 'N/A')
        WHERE fuel_type IS NULL OR make IS NULL;
      `,
      description: 'Atualizando veículos existentes com valores padrão'
    }
  ];
  
  let successCount = 0;
  
  for (const query of queries) {
    const success = await executeSql(query.sql, query.description);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Resumo: ${successCount}/${queries.length} operações executadas com sucesso`);
  
  // Verificar estrutura final
  console.log('\n🔍 Verificando estrutura final...');
  await checkTableStructure();
  
  // Mostrar alguns registros de exemplo
  try {
    const { data: vehicles, error } = await supabase
      .from('veiculos')
      .select('id, placa, make, model, modelo, year, fuel_type, media_consumo_combustivel')
      .limit(5);
    
    if (!error && vehicles) {
      console.log('\n📋 Primeiros registros da tabela:');
      vehicles.forEach(vehicle => {
        console.log(`  - ID: ${vehicle.id}, Placa: ${vehicle.placa}, Marca: ${vehicle.make || 'N/A'}, Modelo: ${vehicle.model || vehicle.modelo || 'N/A'}`);
      });
    }
  } catch (error) {
    console.log('ℹ️ Não foi possível mostrar registros de exemplo');
  }
}

// Executar o script
updateVehiclesTable()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
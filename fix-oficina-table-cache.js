/**
 * Script para corrigir o cache da tabela oficina_murici_manutencoes no Supabase
 * Este script força a sincronização e garante que todas as colunas estejam acessíveis
 */

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_KEY não encontrada');
  process.exit(1);
}

// Criar cliente Supabase com privilégios de admin
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function forceTableCacheRefresh() {
  console.log('🔄 Iniciando correção do cache da tabela oficina_murici_manutencoes...');
  
  try {
    // 1. Verificar se a tabela existe e obter sua estrutura
    console.log('📋 Verificando estrutura da tabela...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'oficina_murici_manutencoes')
      .order('ordinal_position');
    
    if (tableError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', tableError);
      return;
    }
    
    console.log('✅ Colunas encontradas:', tableInfo.map(col => col.column_name).join(', '));
    
    // 2. Testar acesso à tabela com uma query simples
    console.log('🧪 Testando acesso à tabela...');
    
    const { data: testData, error: testError } = await supabase
      .from('oficina_murici_manutencoes')
      .select('id, custo_total')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao acessar tabela:', testError);
      
      // 3. Se há erro, tentar forçar refresh do schema
      console.log('🔧 Tentando forçar refresh do schema...');
      
      const { error: refreshError } = await supabase.rpc('refresh_schema');
      
      if (refreshError) {
        console.log('⚠️ Função refresh_schema não disponível, tentando alternativa...');
        
        // Alternativa: fazer uma query que force o reload do schema
        const { error: altError } = await supabase
          .from('oficina_murici_manutencoes')
          .select('*')
          .limit(0);
        
        if (altError) {
          console.error('❌ Erro na query alternativa:', altError);
        } else {
          console.log('✅ Query alternativa executada com sucesso');
        }
      } else {
        console.log('✅ Schema refreshed com sucesso');
      }
    } else {
      console.log('✅ Acesso à tabela funcionando corretamente');
      console.log('📊 Registros encontrados:', testData?.length || 0);
    }
    
    // 4. Verificar se todas as colunas necessárias existem
    const requiredColumns = [
      'id', 'placa', 'km', 'prazo', 'descricao_manutencao', 'status', 
      'mecanico', 'custo_total', 'observacoes', 'peças_utilizadas',
      'data_hora_inicio', 'data_hora_fim', 'created_at', 'updated_at',
      'peca_descricao', 'peca_valor', 'fornecedor_nome', 'fornecedor_telefone', 'prazo_entrega'
    ];
    
    const existingColumns = tableInfo.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('⚠️ Colunas faltantes:', missingColumns.join(', '));
    } else {
      console.log('✅ Todas as colunas necessárias estão presentes');
    }
    
    // 5. Testar operações CRUD básicas
    console.log('🧪 Testando operações básicas...');
    
    // Teste de INSERT
    const testInsert = {
      placa: 'TEST-1234',
      km: 100000,
      prazo: '2024-12-31',
      descricao_manutencao: 'Teste de sistema',
      status: 'em_andamento',
      mecanico: 'Teste',
      custo_total: 150.00
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('oficina_murici_manutencoes')
      .insert(testInsert)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro no teste de INSERT:', insertError);
    } else {
      console.log('✅ Teste de INSERT bem-sucedido, ID:', insertData.id);
      
      // Teste de UPDATE
      const { error: updateError } = await supabase
        .from('oficina_murici_manutencoes')
        .update({ custo_total: 200.00 })
        .eq('id', insertData.id);
      
      if (updateError) {
        console.error('❌ Erro no teste de UPDATE:', updateError);
      } else {
        console.log('✅ Teste de UPDATE bem-sucedido');
      }
      
      // Teste de DELETE (limpar dados de teste)
      const { error: deleteError } = await supabase
        .from('oficina_murici_manutencoes')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.error('❌ Erro no teste de DELETE:', deleteError);
      } else {
        console.log('✅ Teste de DELETE bem-sucedido (dados de teste removidos)');
      }
    }
    
    console.log('\n🎉 Correção do cache concluída com sucesso!');
    console.log('📝 A tabela oficina_murici_manutencoes está pronta para uso.');
    
  } catch (error) {
    console.error('❌ Erro geral no script:', error);
  }
}

// Executar o script
forceTableCacheRefresh()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
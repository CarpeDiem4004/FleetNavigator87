/**
 * Script simples para corrigir o cache do Supabase
 * Força uma operação que atualiza o cache da tabela oficina_murici_manutencoes
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Variável VITE_SUPABASE_SERVICE_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function forceRefreshCache() {
  console.log('🔄 Forçando atualização do cache...');
  
  try {
    // 1. Teste simples de acesso à tabela
    console.log('📊 Testando acesso à tabela...');
    const { data, error } = await supabase
      .from('oficina_murici_manutencoes')
      .select('id, custo_total')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na primeira tentativa:', error.message);
      
      // 2. Forçar refresh fazendo uma operação de insert/delete rápida
      console.log('🔧 Forçando refresh com operação de teste...');
      
      const testData = {
        placa: 'CACHE-TEST',
        km: 0,
        prazo: '2024-01-01',
        descricao_manutencao: 'Teste de cache',
        status: 'em_andamento',
        mecanico: 'Sistema',
        custo_total: 0
      };
      
      // Insert de teste
      const { data: insertResult, error: insertError } = await supabase
        .from('oficina_murici_manutencoes')
        .insert(testData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro no insert de teste:', insertError.message);
      } else {
        console.log('✅ Insert de teste realizado, ID:', insertResult.id);
        
        // Delete imediato para limpar
        const { error: deleteError } = await supabase
          .from('oficina_murici_manutencoes')
          .delete()
          .eq('id', insertResult.id);
        
        if (deleteError) {
          console.error('❌ Erro ao limpar teste:', deleteError.message);
        } else {
          console.log('✅ Teste limpo com sucesso');
        }
      }
      
      // 3. Testar novamente após o refresh
      console.log('🔍 Testando novamente após refresh...');
      const { data: retestData, error: retestError } = await supabase
        .from('oficina_murici_manutencoes')
        .select('id, custo_total')
        .limit(1);
      
      if (retestError) {
        console.error('❌ Ainda há erro após refresh:', retestError.message);
      } else {
        console.log('✅ Cache corrigido! Acesso funcionando normalmente');
      }
      
    } else {
      console.log('✅ Tabela já está acessível, cache funcionando corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
forceRefreshCache()
  .then(() => {
    console.log('\n🎉 Correção finalizada!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Falha na correção:', error.message);
    process.exit(1);
  });
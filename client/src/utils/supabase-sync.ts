import { supabase, supabaseAdmin } from '@/lib/supabase-client';

/**
 * Envia um registro de abastecimento para o Supabase
 */
export async function enviarAbastecimentoSupabase(dadosAbastecimento: any) {
  try {
    console.log('Enviando abastecimento para o Supabase:', dadosAbastecimento);
    
    // Formatação de dados para o Supabase
    const dadosFormatados = {
      placa: dadosAbastecimento.placa.toUpperCase(),
      km_atual: Number(dadosAbastecimento.km_atual) || 0,
      tipo_combustivel: dadosAbastecimento.tipo_combustivel || 'Diesel',
      litros: Number(dadosAbastecimento.quantidade_litros) || 0,
      quantity_litros: Number(dadosAbastecimento.quantidade_litros) || 0,
      nome_motorista: dadosAbastecimento.nome_motorista || 'Não informado',
      nome_operador: dadosAbastecimento.nome_operador || 'Não informado',
      posto: dadosAbastecimento.posto_id,
      project: dadosAbastecimento.project || 'Não informado',
      preco_litro: Number(dadosAbastecimento.preco_litro) || 0,
      valor_total: Number(dadosAbastecimento.valor_total) || 0,
      rg_motorista: dadosAbastecimento.rg_motorista || 'Não informado',
      created_at: new Date().toISOString()
    };

    // Primeiro tenta com cliente normal
    let { data, error } = await supabase
      .from('abastecimentos_postos')
      .insert([dadosFormatados])
      .select();

    // Se falhar, tenta com cliente admin
    if (error) {
      console.warn('Erro ao inserir no Supabase com cliente normal, tentando com admin:', error);
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('abastecimentos_postos')
        .insert([dadosFormatados])
        .select();

      if (adminError) {
        throw adminError;
      }
      
      data = adminData;
    }

    console.log('Abastecimento inserido com sucesso no Supabase:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar abastecimento para o Supabase:', error);
    return { success: false, error };
  }
}

/**
 * Sincroniza abastecimentos locais com o Supabase
 */
export async function sincronizarAbastecimentosSupabase(posto: string) {
  try {
    // Busca abastecimentos locais não sincronizados
    const response = await fetch(`/api/sincronizar-supabase/${posto}`);
    if (!response.ok) {
      throw new Error(`Erro ao buscar abastecimentos: ${response.statusText}`);
    }
    
    const { data } = await response.json();
    console.log(`Encontrados ${data.length} abastecimentos para sincronizar`);
    
    const resultados = [];
    
    // Envia cada abastecimento para o Supabase
    for (const abastecimento of data) {
      const resultado = await enviarAbastecimentoSupabase(abastecimento);
      resultados.push({
        id: abastecimento.id,
        success: resultado.success
      });
    }
    
    // Marca como sincronizados no sistema local
    if (resultados.length > 0) {
      const idsParaMarcar = resultados
        .filter(r => r.success)
        .map(r => r.id);
      
      if (idsParaMarcar.length > 0) {
        await fetch('/api/marcar-sincronizados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: idsParaMarcar })
        });
      }
    }
    
    return {
      success: true,
      total: data.length,
      sincronizados: resultados.filter(r => r.success).length,
      falhas: resultados.filter(r => !r.success).length
    };
  } catch (error) {
    console.error('Erro ao sincronizar abastecimentos:', error);
    return { success: false, error };
  }
}
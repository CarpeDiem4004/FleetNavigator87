import { supabase, supabaseAdmin } from '@/lib/supabase-client';

/**
 * Envia um registro de abastecimento para o Supabase
 */
export async function enviarAbastecimentoSupabase(dadosAbastecimento: any) {
  try {
    console.log('Enviando abastecimento para o Supabase:', dadosAbastecimento);
    
    // Formatação de dados para o Supabase
    const dadosFormatados = {
      placa: dadosAbastecimento.placa ? dadosAbastecimento.placa.toUpperCase() : 'DESCONHECIDO',
      km_atual: Number(dadosAbastecimento.km_atual) || 0,
      tipo_combustivel: dadosAbastecimento.tipo_combustivel || 'Diesel',
      litros: Number(dadosAbastecimento.quantidade_litros || dadosAbastecimento.litros) || 0,
      quantity_litros: Number(dadosAbastecimento.quantidade_litros || dadosAbastecimento.litros) || 0,
      nome_motorista: dadosAbastecimento.nome_motorista || 'Não informado',
      nome_operador: dadosAbastecimento.nome_operador || 'Não informado',
      posto: dadosAbastecimento.posto_id || dadosAbastecimento.posto || 'Não informado',
      project: dadosAbastecimento.project || 'Não informado',
      preco_litro: Number(dadosAbastecimento.preco_litro) || 0,
      valor_total: Number(dadosAbastecimento.valor_total) || 0,
      rg_motorista: dadosAbastecimento.rg_motorista || 'Não informado',
      created_at: dadosAbastecimento.created_at || new Date().toISOString(),
      sincronizado_supabase: true
    };

    // Log para debug
    console.log('Dados formatados para envio:', dadosFormatados);

    // Estratégia 1: Primeiro tenta diretamente via API para garantir autenticação via servidor
    try {
      console.log('Tentando inserir via API do servidor...');
      
      // Adiciona token de autenticação, se disponível
      const accessToken = localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Se tiver token, adiciona ao cabeçalho
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const apiResponse = await fetch('/api/supabase-insert', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          table: 'abastecimentos_postos',
          data: dadosFormatados
        })
      });
      
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log('Inserção via API do servidor bem-sucedida:', result);
        return { success: true, data: result.data };
      }
      
      console.warn('Inserção via API do servidor falhou, tentando método alternativo');
    } catch (apiError) {
      console.error('Erro ao tentar inserção via API:', apiError);
    }

    // Estratégia 2: Tenta com cliente normal
    try {
      console.log('Tentando inserir com cliente Supabase normal...');
      const { data, error } = await supabase
        .from('abastecimentos_postos')
        .insert([dadosFormatados])
        .select();

      if (!error) {
        console.log('Inserção com cliente normal bem-sucedida:', data);
        return { success: true, data };
      }
      
      console.warn('Erro ao inserir com cliente normal:', error);
    } catch (clientError) {
      console.error('Exceção ao inserir com cliente normal:', clientError);
    }

    // Estratégia 3: Tenta com cliente admin
    try {
      console.log('Tentando inserir com cliente admin...');
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('abastecimentos_postos')
        .insert([dadosFormatados])
        .select();

      if (!adminError) {
        console.log('Inserção com cliente admin bem-sucedida:', adminData);
        return { success: true, data: adminData };
      }
      
      console.error('Erro ao inserir com cliente admin:', adminError);
    } catch (adminClientError) {
      console.error('Exceção ao inserir com cliente admin:', adminClientError);
    }

    // Se chegou aqui, todas as tentativas falharam
    throw new Error('Todas as tentativas de inserção no Supabase falharam');
  } catch (error) {
    console.error('Erro ao enviar abastecimento para o Supabase:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sincroniza abastecimentos locais com o Supabase
 */
export async function sincronizarAbastecimentosSupabase(posto: string) {
  try {
    console.log(`Iniciando sincronização para o posto ${posto}`);

    // Busca abastecimentos locais não sincronizados
    const response = await fetch(`/api/sincronizar-supabase/${posto}`);
    if (!response.ok) {
      throw new Error(`Erro ao buscar abastecimentos: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.success) {
      throw new Error(`API retornou erro: ${responseData.message}`);
    }
    
    const data = responseData.data || [];
    console.log(`Encontrados ${data.length} abastecimentos para sincronizar`);
    
    if (data.length === 0) {
      return {
        success: true,
        total: 0,
        sincronizados: 0,
        falhas: 0,
        message: 'Nenhum abastecimento pendente para sincronização'
      };
    }
    
    const resultados = [];
    
    // Envia cada abastecimento para o Supabase
    for (const abastecimento of data) {
      console.log(`Processando abastecimento ID ${abastecimento.id}`);
      const resultado = await enviarAbastecimentoSupabase(abastecimento);
      resultados.push({
        id: abastecimento.id,
        success: resultado.success,
        message: resultado.success ? 'Sincronizado com sucesso' : (resultado.error || 'Falha na sincronização')
      });
    }
    
    // Marca como sincronizados no sistema local
    if (resultados.length > 0) {
      const idsParaMarcar = resultados
        .filter(r => r.success)
        .map(r => r.id);
      
      if (idsParaMarcar.length > 0) {
        console.log(`Marcando ${idsParaMarcar.length} registros como sincronizados`);
        try {
          const markResponse = await fetch('/api/marcar-sincronizados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: idsParaMarcar })
          });
          
          if (!markResponse.ok) {
            console.warn('Aviso: Não foi possível marcar registros como sincronizados:', await markResponse.text());
          }
        } catch (markError) {
          console.warn('Erro ao marcar registros como sincronizados:', markError);
        }
      }
    }
    
    const sincronizados = resultados.filter(r => r.success).length;
    const falhas = resultados.filter(r => !r.success).length;
    
    console.log(`Sincronização concluída: ${sincronizados} sincronizados, ${falhas} falhas`);
    
    return {
      success: true,
      total: data.length,
      sincronizados,
      falhas,
      resultadosDetalhados: resultados
    };
  } catch (error) {
    console.error('Erro ao sincronizar abastecimentos:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      total: 0,
      sincronizados: 0,
      falhas: 0
    };
  }
}
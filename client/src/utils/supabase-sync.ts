// Já não precisamos mais importar clientes Supabase pois usamos apenas a API do servidor
// import { supabase, supabaseAdmin } from '@/lib/supabase-client';

/**
 * Envia um registro de abastecimento para o Supabase
 */
export async function enviarAbastecimentoSupabase(dadosAbastecimento: any) {
  try {
    console.log('Enviando abastecimento para o Supabase:', dadosAbastecimento);
    
    // Formatação de dados para a nova tabela abastecimentos_supabase
    const dadosFormatados = {
      codigo_posto: dadosAbastecimento.posto_id || dadosAbastecimento.posto || 'desconhecido',
      nome_posto: dadosAbastecimento.posto_id 
        ? dadosAbastecimento.posto_id.charAt(0).toUpperCase() + dadosAbastecimento.posto_id.slice(1).toLowerCase()
        : dadosAbastecimento.posto || 'Desconhecido',
      placa: dadosAbastecimento.placa ? dadosAbastecimento.placa.toUpperCase() : 'DESCONHECIDO',
      motorista: dadosAbastecimento.nome_motorista || 'Não informado',
      rg_motorista: dadosAbastecimento.rg_motorista || 'Não informado',
      km_atual: Number(dadosAbastecimento.km_atual) || 0,
      km_anterior: Number(dadosAbastecimento.km_anterior) || 0,
      tipo_combustivel: dadosAbastecimento.tipo_combustivel || 'Diesel',
      quantidade_litros: Number(dadosAbastecimento.quantidade_litros || dadosAbastecimento.litros) || 0,
      preco_litro: Number(dadosAbastecimento.preco_litro) || 0,
      valor_total: Number(dadosAbastecimento.valor_total) || 0,
      projeto: dadosAbastecimento.projeto || dadosAbastecimento.project || 'Não informado',
      observacoes: dadosAbastecimento.observacoes || '',
      operador: dadosAbastecimento.nome_operador || 'Não informado',
      origem: 'replit',
      created_at: dadosAbastecimento.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Log para debug
    console.log('Dados formatados para envio:', dadosFormatados);

    // Usando apenas a estratégia via API do servidor que não requer autenticação direta com Supabase
    console.log('Realizando inserção usando a API do servidor...');
    
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
        table: 'abastecimentos_supabase',
        data: dadosFormatados
      })
    });
    
    if (apiResponse.ok) {
      const result = await apiResponse.json();
      console.log('Inserção via API do servidor bem-sucedida:', result);
      return { success: true, data: result.data };
    } else {
      const errorText = await apiResponse.text();
      console.error('Erro na resposta da API:', errorText);
      throw new Error(`Erro na API: ${apiResponse.status} - ${errorText}`);
    }
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
    // Adiciona token de autenticação, se disponível
    const accessToken = localStorage.getItem('access_token');
    const headers: Record<string, string> = {};
    
    // Se tiver token, adiciona ao cabeçalho
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`/api/sincronizar-supabase/${posto}`, { headers });
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
          // Adiciona token de autenticação, se disponível
          const accessToken = localStorage.getItem('access_token');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          // Se tiver token, adiciona ao cabeçalho
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
          
          const markResponse = await fetch('/api/marcar-sincronizados', {
            method: 'POST',
            headers,
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
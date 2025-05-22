/**
 * API Especializada para o posto Guarulhos V2
 * 
 * Esta API foi criada para resolver o problema específico do campo 'projeto'
 * no posto Guarulhos V2, onde comentários JavaScript na SQL estavam causando
 * erros ao tentar salvar dados.
 */

type AbastecimentoData = {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
};

/**
 * Insere um registro de abastecimento no posto Guarulhos V2 usando a rota SQL segura
 * 
 * @param dadosAbastecimento Dados do abastecimento a serem inseridos
 * @returns Resultado da operação
 */
export async function inserirAbastecimentoGuarulhosV2(dadosAbastecimento: any): Promise<AbastecimentoData> {
  try {
    console.log('>>> Iniciando inserção de abastecimento em Guarulhos V2 via SQL segura');
    
    // Preparar os dados necessários para a inserção
    const dados = {
      placa: dadosAbastecimento.placa.toUpperCase(),
      km_atual: Number(dadosAbastecimento.km_atual || dadosAbastecimento.km || 0),
      tipo_combustivel: dadosAbastecimento.tipo_combustivel || dadosAbastecimento.tipo || 'Diesel',
      litros: Number(dadosAbastecimento.quantidade_litros || dadosAbastecimento.litros || dadosAbastecimento.quantidade || 0),
      quantity_litros: Number(dadosAbastecimento.quantidade_litros || dadosAbastecimento.litros || dadosAbastecimento.quantidade || 0),
      valor_litro: Number(dadosAbastecimento.valor_litro || dadosAbastecimento.preco_litro || 0),
      valor_total: Number(dadosAbastecimento.valor_total || 0),
      nome_motorista: dadosAbastecimento.motorista || dadosAbastecimento.nome_motorista || 'Não informado',
      rg_motorista: dadosAbastecimento.rg_motorista || dadosAbastecimento.motorista_rg || 'Não informado',
      nome_operador: dadosAbastecimento.operador || dadosAbastecimento.nome_operador || 'Sistema',
      // Aqui está o campo que estava causando problemas
      project: dadosAbastecimento.projeto || dadosAbastecimento.project || 'Não informado',
      tipo_veiculo: dadosAbastecimento.tipo_veiculo || 'frota'
    };
    
    // Imprimir dados que estão sendo enviados para debug
    console.log('>>> Dados que serão enviados para Guarulhos V2:', dados);
    
    // Construir a SQL de forma segura, sem usar comentários JavaScript
    const sql = `
      INSERT INTO abastecimentos_posto_guarulhos_v2 (
        placa, km_atual, tipo_combustivel, litros, quantity_litros,
        valor_litro, valor_total, nome_motorista, rg_motorista,
        nome_operador, project, tipo_veiculo, created_at
      ) VALUES (
        '${dados.placa}', ${dados.km_atual}, '${dados.tipo_combustivel}',
        ${dados.litros}, ${dados.quantity_litros}, ${dados.valor_litro},
        ${dados.valor_total}, 
        '${dados.nome_motorista.replace(/'/g, "''")}', 
        '${dados.rg_motorista.replace(/'/g, "''")}',
        '${dados.nome_operador.replace(/'/g, "''")}', 
        '${dados.project.replace(/'/g, "''")}', 
        '${dados.tipo_veiculo}',
        NOW() at time zone 'America/Sao_Paulo'
      ) RETURNING *;
    `;
    
    // Enviar para a rota de SQL segura
    const response = await fetch('/api/sql-seguro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erro ao inserir abastecimento em Guarulhos V2');
    }
    
    console.log('>>> Abastecimento inserido com sucesso em Guarulhos V2:', result);
    
    // Atualizar o nível do tanque (opcional, apenas para manter o sistema consistente)
    try {
      const updateTanqueResponse = await fetch(`/api/configuracao-tanques/atualizar-consumo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          posto: 'Guarulhos_v2',
          tipo: dados.tipo_combustivel,
          quantidade: dados.litros,
          valor: dados.valor_total
        })
      });
      
      const updateResult = await updateTanqueResponse.json();
      console.log('>>> Atualização do tanque:', updateResult);
    } catch (tanqueError) {
      console.warn('Erro ao atualizar tanque, mas abastecimento foi registrado:', tanqueError);
    }
    
    return {
      success: true,
      data: result.rows && result.rows.length > 0 ? result.rows[0] : null,
      message: 'Abastecimento registrado com sucesso'
    };
  } catch (error) {
    console.error('Erro ao inserir abastecimento em Guarulhos V2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Falha ao registrar abastecimento'
    };
  }
}

/**
 * Busca o histórico de abastecimentos do posto Guarulhos V2
 * 
 * @returns Lista de abastecimentos
 */
export async function buscarHistoricoGuarulhosV2(): Promise<AbastecimentoData> {
  try {
    const response = await fetch('/api/historico-direto/posto guarulhos v2');
    const result = await response.json();
    
    return {
      success: true,
      data: result.data || [],
      message: 'Histórico recuperado com sucesso'
    };
  } catch (error) {
    console.error('Erro ao buscar histórico de Guarulhos V2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Falha ao recuperar histórico'
    };
  }
}
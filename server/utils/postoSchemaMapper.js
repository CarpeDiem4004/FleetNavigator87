/**
 * Utilitário para mapear campos de abastecimento conforme o schema específico de cada posto
 * Resolve inconsistências entre diferentes estruturas de tabelas
 */

/**
 * Mapa de configuração de schemas por posto
 */
const POSTO_SCHEMAS = {
  'guarulhos_v2': {
    tableName: 'abastecimentos_posto_guarulhos_v2',
    fields: {
      quantidade: 'litros',           // Guarulhos usa 'litros'
      km: 'km_atual',                 // Guarulhos usa 'km_atual'
      motorista: 'nome_motorista',    // Guarulhos usa 'nome_motorista'
      motorista_rg: 'rg_motorista',   // Guarulhos usa 'rg_motorista'
      operador: 'nome_operador',      // Guarulhos usa 'nome_operador'
      valor_litro: 'valor_litro',     // Igual
      valor_total: 'valor_total',     // Igual
      placa: 'placa',                 // Igual
      tipo_combustivel: 'tipo_combustivel', // Igual
      projeto: 'projeto',             // Igual
      tipo_veiculo: 'tipo_veiculo',   // Igual
      observacoes: 'observacoes'      // Igual
    }
  },
  'campinas_v2': {
    tableName: 'abastecimentos_posto_campinas_v2',
    fields: {
      quantidade: 'quantidade_litros',
      km: 'km',
      motorista: 'motorista',
      motorista_rg: 'motorista_rg',
      operador: 'operador',
      valor_litro: 'valor_litro',
      valor_total: 'valor_total',
      placa: 'placa',
      tipo_combustivel: 'tipo_combustivel',
      projeto: 'projeto',
      tipo_veiculo: 'tipo_veiculo',
      observacoes: 'observacoes'
    }
  },
  'osasco_v2': {
    tableName: 'abastecimentos_posto_osasco_v2',
    fields: {
      quantidade: 'quantidade_litros',
      km: 'km',
      motorista: 'motorista',
      motorista_rg: 'motorista_rg',
      operador: 'operador',
      valor_litro: 'valor_litro',
      valor_total: 'valor_total',
      placa: 'placa',
      tipo_combustivel: 'tipo_combustivel',
      projeto: 'projeto',
      tipo_veiculo: 'tipo_veiculo',
      observacoes: 'observacoes'
    }
  },
  'socorro_v2': {
    tableName: 'abastecimentos_posto_socorro_v2',
    fields: {
      quantidade: 'quantidade_litros',
      km: 'km',
      motorista: 'motorista',
      motorista_rg: 'motorista_rg',
      operador: 'operador',
      valor_litro: 'valor_litro',
      valor_total: 'valor_total',
      placa: 'placa',
      tipo_combustivel: 'tipo_combustivel',
      projeto: 'projeto',
      tipo_veiculo: 'tipo_veiculo',
      observacoes: 'observacoes'
    }
  },
  'sorocaba_v2': {
    tableName: 'abastecimentos_posto_sorocaba_v2',
    fields: {
      quantidade: 'quantidade_litros',
      km: 'km',
      motorista: 'motorista',
      motorista_rg: 'motorista_rg',
      operador: 'operador',
      valor_litro: 'valor_litro',
      valor_total: 'valor_total',
      placa: 'placa',
      tipo_combustivel: 'tipo_combustivel',
      projeto: 'projeto',
      tipo_veiculo: 'tipo_veiculo',
      observacoes: 'observacoes'
    }
  },
  'abc_v2': {
    tableName: 'abastecimentos_posto_abc_v2',
    fields: {
      quantidade: 'quantidade_litros',
      km: 'km',
      motorista: 'motorista',
      motorista_rg: 'motorista_rg',
      operador: 'operador',
      valor_litro: 'valor_litro',
      valor_total: 'valor_total',
      placa: 'placa',
      tipo_combustivel: 'tipo_combustivel',
      projeto: 'projeto',
      tipo_veiculo: 'tipo_veiculo',
      observacoes: 'observacoes'
    }
  }
};

/**
 * Mapeia dados de entrada para o schema específico do posto
 * @param {string} posto - Nome do posto (ex: 'guarulhos_v2')
 * @param {Object} dadosEntrada - Dados no formato padrão
 * @returns {Object} Dados mapeados para o schema do posto
 */
export function mapearDadosParaPosto(posto, dadosEntrada) {
  const postoKey = posto.toLowerCase();
  const schema = POSTO_SCHEMAS[postoKey];
  
  if (!schema) {
    console.warn(`Schema não encontrado para posto: ${posto}. Usando dados originais.`);
    return dadosEntrada;
  }
  
  const dadosMapeados = {};
  
  // Mapear cada campo conforme o schema do posto
  Object.keys(schema.fields).forEach(campoGenerico => {
    const campoEspecifico = schema.fields[campoGenerico];
    
    // Verificar se o dado de entrada tem esse campo (com diferentes variações)
    let valor = dadosEntrada[campoGenerico] || 
                dadosEntrada[campoEspecifico] ||
                dadosEntrada[`${campoGenerico}_litros`] ||
                dadosEntrada[`nome_${campoGenerico}`] ||
                dadosEntrada[`${campoGenerico}_atual`];
    
    // Casos especiais para compatibilidade
    if (campoGenerico === 'quantidade') {
      valor = valor || dadosEntrada.litros || dadosEntrada.quantidade_litros;
    }
    
    if (campoGenerico === 'km') {
      valor = valor || dadosEntrada.km_atual;
    }
    
    if (campoGenerico === 'motorista') {
      valor = valor || dadosEntrada.nome_motorista;
    }
    
    if (campoGenerico === 'motorista_rg') {
      valor = valor || dadosEntrada.rg_motorista;
    }
    
    if (campoGenerico === 'operador') {
      valor = valor || dadosEntrada.nome_operador;
    }
    
    // Definir o valor no campo mapeado
    if (valor !== undefined && valor !== null) {
      dadosMapeados[campoEspecifico] = valor;
    }
  });
  
  // Adicionar campos adicionais que sempre devem estar presentes
  dadosMapeados.created_at = dadosEntrada.created_at || new Date();
  
  console.log(`Dados mapeados para ${posto}:`, {
    original: Object.keys(dadosEntrada),
    mapeado: Object.keys(dadosMapeados)
  });
  
  return dadosMapeados;
}

/**
 * Obtém o nome da tabela para um posto específico
 * @param {string} posto - Nome do posto
 * @returns {string} Nome da tabela
 */
export function obterNomeTabela(posto) {
  const postoKey = posto.toLowerCase();
  const schema = POSTO_SCHEMAS[postoKey];
  
  if (!schema) {
    console.warn(`Schema não encontrado para posto: ${posto}`);
    return `abastecimentos_posto_${postoKey}`;
  }
  
  return schema.tableName;
}

/**
 * Obtém os campos mapeados para leitura de dados (para consultas SELECT)
 * @param {string} posto - Nome do posto
 * @returns {string} Query SQL com campos mapeados
 */
export function obterCamposMapeadosParaLeitura(posto) {
  const postoKey = posto.toLowerCase();
  const schema = POSTO_SCHEMAS[postoKey];
  
  if (!schema) {
    // Retorna campos padrão se não houver schema específico
    return `
      id,
      placa,
      km,
      tipo_combustivel,
      quantidade_litros,
      motorista as nome_motorista,
      motorista_rg as rg_motorista,
      operador as nome_operador,
      valor_litro,
      valor_total,
      tipo_veiculo,
      observacoes,
      projeto,
      to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora,
      created_at
    `;
  }
  
  // Mapear campos para leitura (reverso do mapeamento de escrita)
  const camposLeitura = [
    'id',
    `${schema.fields.placa} as placa`,
    `${schema.fields.km} as km`,
    `${schema.fields.tipo_combustivel} as tipo_combustivel`,
    `${schema.fields.quantidade} as quantidade_litros`,
    `${schema.fields.motorista} as nome_motorista`,
    `${schema.fields.motorista_rg} as rg_motorista`,
    `${schema.fields.operador} as nome_operador`,
    `${schema.fields.valor_litro} as valor_litro`,
    `${schema.fields.valor_total} as valor_total`,
    `${schema.fields.tipo_veiculo} as tipo_veiculo`,
    `${schema.fields.observacoes} as observacoes`,
    `${schema.fields.projeto} as projeto`,
    `to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora`,
    'created_at'
  ];
  
  return camposLeitura.join(',\n      ');
}

/**
 * Valida se um posto é suportado pelo mapeador
 * @param {string} posto - Nome do posto
 * @returns {boolean} Se o posto é suportado
 */
export function isPostoSuportado(posto) {
  const postoKey = posto.toLowerCase();
  return POSTO_SCHEMAS.hasOwnProperty(postoKey);
}

/**
 * Lista todos os postos suportados
 * @returns {Array} Lista de postos suportados
 */
export function listarPostosSuportados() {
  return Object.keys(POSTO_SCHEMAS);
}
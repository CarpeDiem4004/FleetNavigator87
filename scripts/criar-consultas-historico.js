/**
 * Script para gerar consultas SQL que mostram o histórico de abastecimentos por posto
 * Este script demonstra como utilizar as views e tabelas criadas pelo processo de criação de tabelas
 */

// Lista de postos (igual ao script criar-tabelas-postos-supabase.js)
const postos = [
  'Campinas',
  'Osasco',
  'ABC',
  'Socorro',
  'Sorocaba',
  'SaoPaulo',
  'Ipatinga',
  'BotaFogo',
  'Remedios',
  'VargemGrande',
  'Guarulhos'
];

/**
 * Gera uma consulta SQL para mostrar o histórico de abastecimentos de um posto específico
 * @param {string} posto - Nome do posto
 * @returns {string} Consulta SQL formatada
 */
function gerarConsultaHistoricoPosto(posto) {
  const nomeTabela = `abastecimentos_posto_${posto.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  
  return `
-- Consulta para obter os últimos 10 abastecimentos do posto ${posto}
SELECT 
  id,
  placa,
  COALESCE(hodometro_atual, km_atual) AS km,
  COALESCE(tipo_combustivel, 'Não especificado') AS combustivel,
  COALESCE(litros, quantidade_litros, quantity_litros) AS quantidade_litros,
  COALESCE(motorista, nome_motorista, motorista_nome) AS nome_motorista,
  COALESCE(valor_litro, preco_litro) AS valor_litro,
  valor_total,
  to_char(created_at, 'DD/MM/YYYY HH24:MI') AS data_hora
FROM "${nomeTabela}"
ORDER BY created_at DESC
LIMIT 10;

-- Consulta para estatísticas de consumo mensal do posto ${posto}
SELECT 
  to_char(mes, 'MM/YYYY') AS mes,
  tipo_combustivel,
  total_abastecimentos,
  ROUND(total_litros::numeric, 2) AS total_litros,
  ROUND(valor_total::numeric, 2) AS valor_total,
  ROUND(preco_medio_litro::numeric, 2) AS preco_medio_litro
FROM "${nomeTabela}_estatisticas_mensais"
LIMIT 12;

-- Consulta para obter histórico completo de mudanças em um abastecimento específico
-- Substitua [ID_ABASTECIMENTO] pelo ID do abastecimento desejado
SELECT 
  h.id,
  h.abastecimento_id,
  h.acao,
  h.usuario,
  to_char(h.created_at, 'DD/MM/YYYY HH24:MI:SS') AS data_hora,
  h.dados->>'placa' AS placa,
  h.dados->>'tipo_combustivel' AS combustivel,
  COALESCE(
    (h.dados->>'litros')::numeric, 
    (h.dados->>'quantidade_litros')::numeric, 
    (h.dados->>'quantity_litros')::numeric
  ) AS litros
FROM "${nomeTabela}_historico" h
WHERE h.abastecimento_id = [ID_ABASTECIMENTO]
ORDER BY h.created_at;
`;
}

// Gerar consultas para todos os postos
console.log('CONSULTAS SQL PARA HISTÓRICO DE ABASTECIMENTOS POR POSTO');
console.log('=======================================================\n');

postos.forEach(posto => {
  console.log(`\n/* ===== CONSULTAS PARA POSTO ${posto.toUpperCase()} ===== */`);
  console.log(gerarConsultaHistoricoPosto(posto));
  console.log('/* =============================================== */\n');
});

console.log('\n/* CONSULTA PARA RESUMO GERAL DE TODOS OS POSTOS */');
const todasTabelasAbastecimentos = postos.map(posto => 
  `abastecimentos_posto_${posto.toLowerCase().replace(/[^a-z0-9]/g, '')}`
);

// Gerar uma consulta UNION para todos os postos
let unionQuery = `
-- Resumo de todos os postos (últimos 30 dias)
WITH dados_combinados AS (
`;

// Adicionar cada tabela à consulta UNION
todasTabelasAbastecimentos.forEach((tabela, index) => {
  unionQuery += `  SELECT 
    '${postos[index]}' AS nome_posto,
    COALESCE(tipo_combustivel, 'Não especificado') AS tipo_combustivel,
    COUNT(*) AS total_abastecimentos,
    SUM(COALESCE(litros, quantidade_litros, quantity_litros)) AS total_litros,
    SUM(valor_total) AS valor_total
  FROM "${tabela}"
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY tipo_combustivel`;
  
  if (index < todasTabelasAbastecimentos.length - 1) {
    unionQuery += `
  
  UNION ALL
  
`;
  }
});

unionQuery += `
)
SELECT 
  nome_posto,
  tipo_combustivel,
  total_abastecimentos,
  ROUND(total_litros::numeric, 2) AS total_litros,
  ROUND(valor_total::numeric, 2) AS valor_total,
  CASE 
    WHEN total_litros > 0 THEN ROUND((valor_total / total_litros)::numeric, 2)
    ELSE 0
  END AS preco_medio_litro
FROM dados_combinados
ORDER BY nome_posto, tipo_combustivel;
`;

console.log(unionQuery);
console.log('/* =============================================== */');
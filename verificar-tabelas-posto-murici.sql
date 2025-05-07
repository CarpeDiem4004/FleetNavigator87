-- Script SQL para verificar quais tabelas do Posto Murici já existem no Supabase

-- Primeiro, criar uma tabela temporária com os nomes das tabelas que queremos verificar
CREATE TEMP TABLE tabelas_posto_murici (nome_tabela TEXT);

-- Inserir os nomes das tabelas que queremos verificar
INSERT INTO tabelas_posto_murici VALUES
  ('posto_murici_postos'),
  ('posto_murici_tanques'),
  ('posto_murici_abastecimentos'),
  ('posto_murici_abastecimentos_tanque'),
  ('posto_murici_configuracoes'),
  ('posto_murici_movimentacoes_patio');

-- Verificar quais tabelas existem no esquema público
SELECT 
  t.nome_tabela,
  CASE WHEN pg.tablename IS NOT NULL THEN 'Existe' ELSE 'Não existe' END AS status
FROM 
  tabelas_posto_murici t
LEFT JOIN 
  pg_catalog.pg_tables pg ON pg.tablename = t.nome_tabela AND pg.schemaname = 'public';

-- Mostrar as tabelas que faltam
SELECT 
  t.nome_tabela AS tabelas_faltantes
FROM 
  tabelas_posto_murici t
LEFT JOIN 
  pg_catalog.pg_tables pg ON pg.tablename = t.nome_tabela AND pg.schemaname = 'public'
WHERE 
  pg.tablename IS NULL;

-- Limpar a tabela temporária
DROP TABLE tabelas_posto_murici;
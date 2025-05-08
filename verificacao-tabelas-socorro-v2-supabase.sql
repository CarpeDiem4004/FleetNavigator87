-- Script para verificar e comparar as tabelas do posto Osasco_V2 e Socorro_V2
-- Autor: Sistema Murici Fleet
-- Data: Maio, 2025

-- 1. Verificar quais tabelas do Osasco_V2 existem
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%osasco_v2%' AND table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar quais tabelas do Socorro_V2 existem
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%socorro_v2%' AND table_schema = 'public'
ORDER BY table_name;

-- 3. Verificar quais tabelas do Osasco_V2 não possuem equivalentes no Socorro_V2
SELECT o.table_name AS "Tabela Osasco_V2", 
       REPLACE(o.table_name, 'osasco_v2', 'socorro_v2') AS "Tabela Socorro_V2 Esperada",
       CASE 
         WHEN s.table_name IS NULL THEN 'Faltando' 
         ELSE 'Existente' 
       END AS "Status"
FROM (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_name LIKE '%osasco_v2%' AND table_schema = 'public'
) o
LEFT JOIN (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_name LIKE '%socorro_v2%' AND table_schema = 'public'
) s ON REPLACE(o.table_name, 'osasco_v2', 'socorro_v2') = s.table_name
ORDER BY o.table_name;

-- 4. Verificar colunas da tabela abastecimentos para ambos os postos
SELECT 
  'osasco_v2' AS posto,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'abastecimentos_posto_osasco_v2'
ORDER BY ordinal_position;

SELECT 
  'socorro_v2' AS posto,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'abastecimentos_posto_socorro_v2'
ORDER BY ordinal_position;

-- 5. Verificar diferenças nas colunas das tabelas abastecimentos
SELECT 
  o.column_name AS coluna, 
  o.data_type AS tipo_osasco, 
  s.data_type AS tipo_socorro,
  o.is_nullable AS nulavel_osasco,
  s.is_nullable AS nulavel_socorro,
  CASE 
    WHEN s.column_name IS NULL THEN 'Faltando em Socorro'
    WHEN o.column_name IS NULL THEN 'Faltando em Osasco'
    WHEN o.data_type <> s.data_type THEN 'Tipos diferentes'
    WHEN o.is_nullable <> s.is_nullable THEN 'Nulabilidade diferente'
    ELSE 'Igual'
  END AS status
FROM 
  (SELECT column_name, data_type, is_nullable FROM information_schema.columns 
   WHERE table_name = 'abastecimentos_posto_osasco_v2') o
FULL OUTER JOIN 
  (SELECT column_name, data_type, is_nullable FROM information_schema.columns 
   WHERE table_name = 'abastecimentos_posto_socorro_v2') s
ON o.column_name = s.column_name
WHERE o.column_name IS NULL OR s.column_name IS NULL OR o.data_type <> s.data_type OR o.is_nullable <> s.is_nullable
ORDER BY status, o.column_name;

-- 6. Verificar views existentes para os dois postos
SELECT viewname FROM pg_views 
WHERE viewname LIKE '%osasco_v2%' 
ORDER BY viewname;

SELECT viewname FROM pg_views 
WHERE viewname LIKE '%socorro_v2%' 
ORDER BY viewname;

-- 7. Verificar configuração dos tanques para ambos os postos
SELECT * FROM configuracao_tanques WHERE posto = 'Osasco_v2';
SELECT * FROM configuracao_tanques WHERE posto = 'Socorro_v2';

-- 8. Verificar indices existentes para abastecimentos
SELECT 
    i.relname as index_name,
    a.attname as column_name,
    am.amname as index_type
FROM 
    pg_class t, 
    pg_class i, 
    pg_index ix, 
    pg_attribute a,
    pg_am am
WHERE 
    t.oid = ix.indrelid AND 
    i.oid = ix.indexrelid AND 
    a.attrelid = t.oid AND 
    a.attnum = ANY(ix.indkey) AND
    i.relam = am.oid AND
    t.relname = 'abastecimentos_posto_osasco_v2'
ORDER BY 
    i.relname;

SELECT 
    i.relname as index_name,
    a.attname as column_name,
    am.amname as index_type
FROM 
    pg_class t, 
    pg_class i, 
    pg_index ix, 
    pg_attribute a,
    pg_am am
WHERE 
    t.oid = ix.indrelid AND 
    i.oid = ix.indexrelid AND 
    a.attrelid = t.oid AND 
    a.attnum = ANY(ix.indkey) AND
    i.relam = am.oid AND
    t.relname = 'abastecimentos_posto_socorro_v2'
ORDER BY 
    i.relname;

-- 9. Verificar políticas RLS existentes
SELECT 
    tbl.relname AS table_name,
    pol.polname AS policy_name,
    pol.polpermissive,
    CASE pol.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      WHEN '*' THEN 'ALL'
    END AS command
FROM 
    pg_policy pol
JOIN 
    pg_class tbl ON tbl.oid = pol.polrelid
WHERE 
    tbl.relname LIKE '%osasco_v2%'
ORDER BY 
    tbl.relname, pol.polname;

SELECT 
    tbl.relname AS table_name,
    pol.polname AS policy_name,
    pol.polpermissive,
    CASE pol.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      WHEN '*' THEN 'ALL'
    END AS command
FROM 
    pg_policy pol
JOIN 
    pg_class tbl ON tbl.oid = pol.polrelid
WHERE 
    tbl.relname LIKE '%socorro_v2%'
ORDER BY 
    tbl.relname, pol.polname;
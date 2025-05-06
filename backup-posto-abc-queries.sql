-- Backup de comandos SQL para o posto ABC
-- Gerado em: Maio/2025
-- Este arquivo contém consultas para verificar e remover o posto ABC do Supabase

-- Verificar tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name LIKE 'abastecimentos_posto_abc' OR 
  table_name LIKE 'movimentacoes_patio_posto_abc' OR
  table_name LIKE 'configuracao_tanques_posto_abc'
);

-- Comandos para remover as tabelas do posto ABC
DROP TABLE IF EXISTS abastecimentos_posto_abc CASCADE;
DROP TABLE IF EXISTS movimentacoes_patio_posto_abc CASCADE;
DROP TABLE IF EXISTS configuracao_tanques_posto_abc CASCADE;

-- Limpar associações de usuários com o posto ABC (se existirem)
-- A tabela users tem "basename" em vez de "posto_id"
UPDATE users 
SET basename = NULL 
WHERE basename = 'abc';

-- Verificação final após remoção
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name LIKE 'abastecimentos_posto_abc' OR 
  table_name LIKE 'movimentacoes_patio_posto_abc' OR
  table_name LIKE 'configuracao_tanques_posto_abc'
);
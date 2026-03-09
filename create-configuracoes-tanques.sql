-- PARTE 5: CONFIGURAÇÕES INICIAIS DOS TANQUES
-- Script para inserir as configurações iniciais dos tanques de cada posto no Supabase

-- Configuração para Osasco_v2 (se não existir)
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Osasco_v2', 
  15000, 
  10000, 
  800, 
  500, 
  5.10, 
  3.10
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Osasco_v2'
  );

-- Configuração para Socorro_v2 (se não existir)
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Socorro_v2', 
  12000, 
  8000, 
  700, 
  450, 
  5.05, 
  3.05
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Socorro_v2'
  );

-- Configuração para Sorocaba_v2 (se não existir)
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Sorocaba_v2', 
  10000, 
  7500, 
  600, 
  400, 
  5.15, 
  3.15
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Sorocaba_v2'
  );

-- Configuração para ABC_v2 (se não existir)
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Abc_v2', 
  18000, 
  12000, 
  900, 
  600, 
  5.08, 
  3.08
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Abc_v2'
  );

-- Configuração para Alair_v2 (se não existir)
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Alair_v2', 
  8000, 
  5000, 
  500, 
  320, 
  5.12, 
  3.12
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Alair_v2'
  );

-- Configuração para Guarulhos_v2 (se não existir)
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Guarulhos_v2', 
  16000, 
  11000, 
  850, 
  580, 
  5.18, 
  3.18
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Guarulhos_v2'
  );
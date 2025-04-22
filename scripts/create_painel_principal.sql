-- Criar a tabela painel_principal
CREATE TABLE IF NOT EXISTS painel_principal (
  id SERIAL PRIMARY KEY,
  data_referencia DATE NOT NULL,
  manutencoes_pendentes INTEGER NOT NULL DEFAULT 0,
  tempo_medio_manutencao TEXT,
  veiculos_parados INTEGER NOT NULL DEFAULT 0,
  dias_parados_total INTEGER NOT NULL DEFAULT 0,
  viagens_concluidas INTEGER NOT NULL DEFAULT 0,
  viagens_no_show INTEGER NOT NULL DEFAULT 0,
  viagens_canceladas_cliente INTEGER NOT NULL DEFAULT 0,
  litros_diesel_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  gasto_total_combustivel DECIMAL(10, 2) NOT NULL DEFAULT 0,
  qtd_sinistros INTEGER NOT NULL DEFAULT 0,
  qtd_roubos INTEGER NOT NULL DEFAULT 0,
  incidentes_seguranca_trabalho INTEGER NOT NULL DEFAULT 0,
  movimentacoes_pneus INTEGER NOT NULL DEFAULT 0,
  pneus_substituidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados iniciais
INSERT INTO painel_principal (
  data_referencia,
  manutencoes_pendentes,
  tempo_medio_manutencao,
  veiculos_parados,
  dias_parados_total,
  viagens_concluidas,
  viagens_no_show,
  viagens_canceladas_cliente,
  litros_diesel_total,
  gasto_total_combustivel,
  qtd_sinistros,
  qtd_roubos,
  incidentes_seguranca_trabalho,
  movimentacoes_pneus,
  pneus_substituidos
) VALUES (
  CURRENT_DATE,
  12,
  '3.5 dias',
  8,
  24,
  145,
  5,
  7,
  8500,
  42500,
  3,
  0,
  1,
  28,
  12
);
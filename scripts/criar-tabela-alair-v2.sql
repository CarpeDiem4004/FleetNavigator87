-- Script para criar a tabela abastecimentos_posto_alair_v2
-- Observações:
-- 1. Este script cria a tabela de abastecimentos para o Posto Alair V2
-- 2. Configura um tanque inicial de diesel com capacidade de 18000 litros e nível atual de 9000 litros
-- 3. Cria views para relatórios e análises
-- 4. Implementa triggers para atualização automática

-- Criação da tabela principal de abastecimentos
CREATE TABLE IF NOT EXISTS abastecimentos_posto_alair_v2 (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    placa TEXT,
    veiculo TEXT,
    motorista TEXT,
    hodometro NUMERIC,
    horimetro NUMERIC,
    tipo_combustivel TEXT,
    quantidade NUMERIC, -- quantidade em litros
    valor_unitario NUMERIC, -- valor por litro
    valor_total NUMERIC,
    forma_pagamento TEXT,
    observacoes TEXT,
    funcionario TEXT, -- funcionário que autorizou o abastecimento
    tanque TEXT, -- identificação do tanque utilizado
    nivel_tanque_apos NUMERIC, -- nível do tanque após o abastecimento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    base TEXT, -- base do veículo
    empresa TEXT, -- empresa do veículo
    tipo_veiculo TEXT, -- tipo de veículo (caminhão, carro, etc.)
    odometro_ant NUMERIC, -- hodômetro anterior
    consumo_medio NUMERIC, -- consumo médio calculado
    km_percorrido NUMERIC, -- quilometragem percorrida desde o último abastecimento
    status TEXT DEFAULT 'ativo' -- status do registro (ativo, cancelado, etc.)
);

-- Verifica se a tabela de configuração de tanques existe, se não existir, cria
CREATE TABLE IF NOT EXISTS configuracao_tanques (
    id SERIAL PRIMARY KEY,
    posto TEXT NOT NULL,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diesel_capacidade NUMERIC DEFAULT 0,
    diesel_nivel NUMERIC DEFAULT 0,
    diesel_valor_litro NUMERIC DEFAULT 0,
    arla_capacidade NUMERIC DEFAULT 0,
    arla_nivel NUMERIC DEFAULT 0,
    arla_valor_litro NUMERIC DEFAULT 0,
    gasolina_capacidade NUMERIC DEFAULT 0,
    gasolina_nivel NUMERIC DEFAULT 0,
    gasolina_valor_litro NUMERIC DEFAULT 0,
    etanol_capacidade NUMERIC DEFAULT 0,
    etanol_nivel NUMERIC DEFAULT 0,
    etanol_valor_litro NUMERIC DEFAULT 0,
    CONSTRAINT unique_posto_config UNIQUE (posto)
);

-- Insere configuração inicial para o tanque do Posto Alair V2
INSERT INTO configuracao_tanques 
    (posto, diesel_capacidade, diesel_nivel, diesel_valor_litro)
VALUES 
    ('Alair_v2', 18000, 9000, 4.25)
ON CONFLICT (posto) 
DO UPDATE SET 
    ultima_atualizacao = CURRENT_TIMESTAMP,
    diesel_capacidade = EXCLUDED.diesel_capacidade,
    diesel_nivel = EXCLUDED.diesel_nivel,
    diesel_valor_litro = EXCLUDED.diesel_valor_litro;

-- Criar view consolidada de abastecimentos
CREATE OR REPLACE VIEW view_abastecimentos_alair_v2_consolidado AS
SELECT 
    id,
    data_hora,
    placa,
    veiculo,
    tipo_combustivel,
    quantidade,
    valor_unitario,
    valor_total,
    hodometro,
    km_percorrido,
    consumo_medio,
    base,
    empresa,
    status
FROM 
    abastecimentos_posto_alair_v2
WHERE 
    status = 'ativo'
ORDER BY 
    data_hora DESC;

-- Criar view para consumo por veículo
CREATE OR REPLACE VIEW view_alair_v2_consumo_por_veiculo AS
SELECT 
    placa,
    veiculo,
    COUNT(*) as total_abastecimentos,
    SUM(quantidade) as litros_totais,
    SUM(valor_total) as valor_total,
    AVG(consumo_medio) as media_consumo,
    MAX(data_hora) as ultimo_abastecimento
FROM 
    abastecimentos_posto_alair_v2
WHERE 
    status = 'ativo'
GROUP BY 
    placa, veiculo
ORDER BY 
    litros_totais DESC;

-- Criar view para consumo mensal
CREATE OR REPLACE VIEW view_alair_v2_consumo_mensal AS
SELECT 
    EXTRACT(YEAR FROM data_hora) as ano,
    EXTRACT(MONTH FROM data_hora) as mes,
    tipo_combustivel,
    COUNT(*) as total_abastecimentos,
    SUM(quantidade) as litros_totais,
    SUM(valor_total) as valor_total,
    AVG(valor_unitario) as valor_medio_litro
FROM 
    abastecimentos_posto_alair_v2
WHERE 
    status = 'ativo'
GROUP BY 
    ano, mes, tipo_combustivel
ORDER BY 
    ano DESC, mes DESC, tipo_combustivel;

-- Criar view para comparativo de combustíveis
CREATE OR REPLACE VIEW view_alair_v2_comparativo_combustiveis AS
SELECT 
    tipo_combustivel,
    COUNT(*) as total_abastecimentos,
    SUM(quantidade) as litros_totais,
    SUM(valor_total) as valor_total,
    AVG(valor_unitario) as valor_medio_litro
FROM 
    abastecimentos_posto_alair_v2
WHERE 
    status = 'ativo'
GROUP BY 
    tipo_combustivel
ORDER BY 
    litros_totais DESC;

-- Criar view para os últimos abastecimentos
CREATE OR REPLACE VIEW view_alair_v2_ultimos_abastecimentos AS
SELECT 
    id,
    data_hora,
    placa,
    veiculo,
    motorista,
    tipo_combustivel,
    quantidade,
    valor_unitario,
    valor_total,
    hodometro,
    funcionario
FROM 
    abastecimentos_posto_alair_v2
WHERE 
    status = 'ativo'
ORDER BY 
    data_hora DESC
LIMIT 50;

-- Função para atualizar o nível do tanque após um abastecimento
CREATE OR REPLACE FUNCTION atualizar_nivel_tanque_alair_v2()
RETURNS TRIGGER AS $$
DECLARE
    tipo_tanque TEXT;
    nivel_atual NUMERIC;
BEGIN
    -- Determina o tipo de tanque com base no tipo de combustível
    IF NEW.tipo_combustivel ILIKE '%diesel%' THEN
        tipo_tanque := 'diesel';
    ELSIF NEW.tipo_combustivel ILIKE '%arla%' THEN
        tipo_tanque := 'arla';
    ELSIF NEW.tipo_combustivel ILIKE '%gasolina%' THEN
        tipo_tanque := 'gasolina';
    ELSIF NEW.tipo_combustivel ILIKE '%etanol%' THEN
        tipo_tanque := 'etanol';
    ELSE
        tipo_tanque := 'diesel'; -- Padrão para outros tipos
    END IF;
    
    -- Obtém o nível atual do tanque
    EXECUTE 'SELECT ' || tipo_tanque || '_nivel FROM configuracao_tanques WHERE posto = ''Alair_v2'''
    INTO nivel_atual;
    
    -- Calcula o novo nível do tanque
    nivel_atual := nivel_atual - NEW.quantidade;
    
    -- Atualiza a configuração do tanque
    EXECUTE 'UPDATE configuracao_tanques SET ' || tipo_tanque || '_nivel = ' || nivel_atual || 
            ', ultima_atualizacao = CURRENT_TIMESTAMP WHERE posto = ''Alair_v2''';
    
    -- Atualiza o nível do tanque no registro de abastecimento
    NEW.nivel_tanque_apos := nivel_atual;
    NEW.tanque := tipo_tanque;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o nível do tanque após um abastecimento
DROP TRIGGER IF EXISTS trigger_atualizar_tanque_alair_v2 ON abastecimentos_posto_alair_v2;
CREATE TRIGGER trigger_atualizar_tanque_alair_v2
BEFORE INSERT ON abastecimentos_posto_alair_v2
FOR EACH ROW
EXECUTE FUNCTION atualizar_nivel_tanque_alair_v2();

-- Função para calcular o consumo médio e quilometragem percorrida
CREATE OR REPLACE FUNCTION calcular_consumo_alair_v2()
RETURNS TRIGGER AS $$
DECLARE
    ultimo_hodometro NUMERIC;
    distancia NUMERIC;
BEGIN
    -- Obtém o último hodômetro registrado para o mesmo veículo
    SELECT hodometro INTO ultimo_hodometro
    FROM abastecimentos_posto_alair_v2
    WHERE placa = NEW.placa AND status = 'ativo' AND id != NEW.id
    ORDER BY data_hora DESC
    LIMIT 1;
    
    -- Se houver um registro anterior, calcula a distância percorrida e o consumo médio
    IF ultimo_hodometro IS NOT NULL AND NEW.hodometro > ultimo_hodometro THEN
        distancia := NEW.hodometro - ultimo_hodometro;
        NEW.km_percorrido := distancia;
        
        -- Calcula o consumo médio (km/l) se a quantidade for maior que zero
        IF NEW.quantidade > 0 THEN
            NEW.consumo_medio := distancia / NEW.quantidade;
        END IF;
        
        -- Armazena o odômetro anterior
        NEW.odometro_ant := ultimo_hodometro;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular o consumo médio antes de inserir
DROP TRIGGER IF EXISTS trigger_calcular_consumo_alair_v2 ON abastecimentos_posto_alair_v2;
CREATE TRIGGER trigger_calcular_consumo_alair_v2
BEFORE INSERT ON abastecimentos_posto_alair_v2
FOR EACH ROW
EXECUTE FUNCTION calcular_consumo_alair_v2();

-- Função para calcular o valor total do abastecimento
CREATE OR REPLACE FUNCTION calcular_valor_total_alair_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcula o valor total se a quantidade e o valor unitário estiverem definidos
    IF NEW.quantidade IS NOT NULL AND NEW.valor_unitario IS NOT NULL THEN
        NEW.valor_total := NEW.quantidade * NEW.valor_unitario;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular o valor total antes de inserir
DROP TRIGGER IF EXISTS trigger_calcular_valor_total_alair_v2 ON abastecimentos_posto_alair_v2;
CREATE TRIGGER trigger_calcular_valor_total_alair_v2
BEFORE INSERT ON abastecimentos_posto_alair_v2
FOR EACH ROW
EXECUTE FUNCTION calcular_valor_total_alair_v2();

-- Adiciona alguns registros de amostra para teste
INSERT INTO abastecimentos_posto_alair_v2 
    (placa, veiculo, motorista, hodometro, tipo_combustivel, quantidade, valor_unitario, 
     forma_pagamento, funcionario, base, empresa, tipo_veiculo)
VALUES 
    ('ABC1234', 'VW Constellation 24.280', 'Carlos Silva', 12500, 'Diesel S10', 120, 4.25, 
     'Cartão Frota', 'João Operador', 'Base Alair', 'Transportadora ABC', 'Caminhão'),
    ('XYZ9876', 'Scania R450', 'Marcos Oliveira', 75300, 'Diesel S10', 200, 4.25, 
     'Cartão Frota', 'Pedro Operador', 'Base Alair', 'Transportadora XYZ', 'Caminhão'),
    ('DEF5678', 'Volvo FH 460', 'Rafael Santos', 45800, 'Diesel S10', 180, 4.25, 
     'Cartão Frota', 'Pedro Operador', 'Base Alair', 'Logística DEF', 'Caminhão'),
    ('GHI9012', 'Mercedes-Benz Actros', 'Bruno Ferreira', 32100, 'Diesel S10', 150, 4.25, 
     'Cartão Frota', 'João Operador', 'Base Alair', 'Transportes GHI', 'Caminhão');
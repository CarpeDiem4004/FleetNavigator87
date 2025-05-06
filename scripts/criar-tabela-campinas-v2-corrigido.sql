-- Script corrigido para criar a tabela abastecimentos_posto_campinas_v2
-- Observações:
-- 1. Este script cria a tabela de abastecimentos para o Posto Campinas V2
-- 2. Usa a estrutura correta da tabela configuracao_tanques (diesel_nivel em vez de diesel_nivel_atual)
-- 3. Cria views para relatórios e análises

-- Criação da tabela principal de abastecimentos
CREATE TABLE IF NOT EXISTS abastecimentos_posto_campinas_v2 (
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
    status TEXT DEFAULT 'ativo' -- status do registro (ativo ou inativo)
);

-- Inserir configuração inicial para o posto Campinas V2 se ainda não existir
INSERT INTO configuracao_tanques 
(posto, diesel_capacidade, diesel_nivel, diesel_valor_litro)
VALUES 
('Campinas_v2', 18000, 9000, 5.79)
ON CONFLICT (posto) DO NOTHING;

-- Criar função para atualizar o nível do tanque após um abastecimento
CREATE OR REPLACE FUNCTION atualizar_nivel_tanque_campinas_v2() 
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza o nível do tanque com base no tipo de combustível
    IF NEW.tipo_combustivel = 'Diesel' THEN
        UPDATE configuracao_tanques
        SET diesel_nivel = diesel_nivel - NEW.quantidade,
            updated_at = CURRENT_TIMESTAMP
        WHERE posto = 'Campinas_v2';
    ELSIF NEW.tipo_combustivel = 'Arla' THEN
        UPDATE configuracao_tanques
        SET arla_nivel = arla_nivel - NEW.quantidade,
            updated_at = CURRENT_TIMESTAMP
        WHERE posto = 'Campinas_v2';
    END IF;
    
    -- Registra o nível do tanque após o abastecimento
    IF NEW.tipo_combustivel = 'Diesel' THEN
        SELECT diesel_nivel INTO NEW.nivel_tanque_apos FROM configuracao_tanques WHERE posto = 'Campinas_v2';
    ELSIF NEW.tipo_combustivel = 'Arla' THEN
        SELECT arla_nivel INTO NEW.nivel_tanque_apos FROM configuracao_tanques WHERE posto = 'Campinas_v2';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o nível do tanque após um abastecimento
DROP TRIGGER IF EXISTS tr_atualizar_nivel_tanque_campinas_v2 ON abastecimentos_posto_campinas_v2;
CREATE TRIGGER tr_atualizar_nivel_tanque_campinas_v2
BEFORE INSERT ON abastecimentos_posto_campinas_v2
FOR EACH ROW
EXECUTE FUNCTION atualizar_nivel_tanque_campinas_v2();

-- Criar função para calcular consumo médio e km percorrido
CREATE OR REPLACE FUNCTION calcular_consumo_campinas_v2() 
RETURNS TRIGGER AS $$
DECLARE
    ultimo_hodometro NUMERIC;
    ultimo_abastecimento RECORD;
BEGIN
    -- Busca o último abastecimento para o mesmo veículo
    SELECT * INTO ultimo_abastecimento FROM abastecimentos_posto_campinas_v2
    WHERE placa = NEW.placa AND id != NEW.id AND status = 'ativo'
    ORDER BY data_hora DESC
    LIMIT 1;
    
    -- Se encontrou um abastecimento anterior
    IF ultimo_abastecimento.id IS NOT NULL THEN
        -- Calcula a quilometragem percorrida
        NEW.odometro_ant := ultimo_abastecimento.hodometro;
        NEW.km_percorrido := NEW.hodometro - ultimo_abastecimento.hodometro;
        
        -- Calcula o consumo médio se a quilometragem for positiva
        IF NEW.km_percorrido > 0 AND NEW.quantidade > 0 THEN
            NEW.consumo_medio := NEW.km_percorrido / NEW.quantidade;
        END IF;
    END IF;
    
    -- Seta o valor unitário automaticamente se não foi informado
    IF NEW.valor_unitario IS NULL OR NEW.valor_unitario = 0 THEN
        IF NEW.tipo_combustivel = 'Diesel' THEN
            SELECT diesel_valor_litro INTO NEW.valor_unitario FROM configuracao_tanques WHERE posto = 'Campinas_v2';
        ELSIF NEW.tipo_combustivel = 'Arla' THEN
            SELECT arla_valor_litro INTO NEW.valor_unitario FROM configuracao_tanques WHERE posto = 'Campinas_v2';
        END IF;
    END IF;
    
    -- Calcula o valor total se não foi informado
    IF NEW.valor_total IS NULL OR NEW.valor_total = 0 THEN
        NEW.valor_total := NEW.quantidade * NEW.valor_unitario;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para calcular consumo médio e km percorrido
DROP TRIGGER IF EXISTS tr_calcular_consumo_campinas_v2 ON abastecimentos_posto_campinas_v2;
CREATE TRIGGER tr_calcular_consumo_campinas_v2
BEFORE INSERT ON abastecimentos_posto_campinas_v2
FOR EACH ROW
EXECUTE FUNCTION calcular_consumo_campinas_v2();

-- Criar função para reabastecimento de tanque
CREATE OR REPLACE FUNCTION reabastecer_tanque_campinas_v2(
    p_tipo_combustivel TEXT,
    p_quantidade NUMERIC,
    p_valor_unitario NUMERIC DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    mensagem TEXT;
    capacidade NUMERIC;
    nivel_atual NUMERIC;
BEGIN
    -- Verifica o tipo de combustível
    IF p_tipo_combustivel = 'Diesel' THEN
        UPDATE configuracao_tanques
        SET diesel_nivel = diesel_nivel + p_quantidade,
            diesel_valor_litro = COALESCE(p_valor_unitario, diesel_valor_litro),
            updated_at = CURRENT_TIMESTAMP
        WHERE posto = 'Campinas_v2'
        RETURNING diesel_capacidade, diesel_nivel INTO capacidade, nivel_atual;
        
    ELSIF p_tipo_combustivel = 'Arla' THEN
        UPDATE configuracao_tanques
        SET arla_nivel = arla_nivel + p_quantidade,
            arla_valor_litro = COALESCE(p_valor_unitario, arla_valor_litro),
            updated_at = CURRENT_TIMESTAMP
        WHERE posto = 'Campinas_v2'
        RETURNING arla_capacidade, arla_nivel INTO capacidade, nivel_atual;
        
    ELSE
        RETURN 'Tipo de combustível não suportado para este posto';
    END IF;
    
    -- Verifica se o nível atual excede a capacidade
    IF nivel_atual > capacidade THEN
        mensagem := 'Alerta: O nível atual de ' || p_tipo_combustivel || ' (' || nivel_atual || 'L) excede a capacidade do tanque (' || capacidade || 'L)';
    ELSE
        mensagem := 'Tanque de ' || p_tipo_combustivel || ' reabastecido com sucesso. Nível atual: ' || nivel_atual || 'L de ' || capacidade || 'L';
    END IF;
    
    RETURN mensagem;
END;
$$ LANGUAGE plpgsql;

-- Criar função para obter o valor do combustível
CREATE OR REPLACE FUNCTION obter_valor_combustivel_campinas_v2(p_tipo_combustivel TEXT) 
RETURNS NUMERIC AS $$
DECLARE
    valor NUMERIC;
BEGIN
    IF p_tipo_combustivel = 'Diesel' THEN
        SELECT diesel_valor_litro INTO valor FROM configuracao_tanques WHERE posto = 'Campinas_v2';
    ELSIF p_tipo_combustivel = 'Arla' THEN
        SELECT arla_valor_litro INTO valor FROM configuracao_tanques WHERE posto = 'Campinas_v2';
    ELSE
        valor := 0;
    END IF;
    
    RETURN valor;
END;
$$ LANGUAGE plpgsql;

-- Criar view para status atual dos tanques
CREATE OR REPLACE VIEW view_campinas_v2_status_tanques AS
SELECT 
    posto,
    diesel_capacidade,
    diesel_nivel,
    (diesel_nivel / NULLIF(diesel_capacidade, 0) * 100)::NUMERIC(5,2) as diesel_percentual,
    diesel_valor_litro,
    arla_capacidade,
    arla_nivel,
    (arla_nivel / NULLIF(arla_capacidade, 0) * 100)::NUMERIC(5,2) as arla_percentual,
    arla_valor_litro,
    updated_at
FROM 
    configuracao_tanques
WHERE 
    posto = 'Campinas_v2';

-- Criar view consolidada de abastecimentos
CREATE OR REPLACE VIEW view_abastecimentos_campinas_v2_consolidado AS
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
    abastecimentos_posto_campinas_v2
WHERE 
    status = 'ativo'
ORDER BY 
    data_hora DESC;

-- Criar view para consumo por veículo
CREATE OR REPLACE VIEW view_campinas_v2_consumo_por_veiculo AS
SELECT 
    placa,
    veiculo,
    COUNT(*) as total_abastecimentos,
    SUM(quantidade) as litros_totais,
    SUM(valor_total) as valor_total,
    AVG(consumo_medio) as media_consumo,
    MAX(data_hora) as ultimo_abastecimento
FROM 
    abastecimentos_posto_campinas_v2
WHERE 
    status = 'ativo'
GROUP BY 
    placa, veiculo
ORDER BY 
    litros_totais DESC;

-- Criar view para consumo mensal
CREATE OR REPLACE VIEW view_campinas_v2_consumo_mensal AS
SELECT 
    EXTRACT(YEAR FROM data_hora) as ano,
    EXTRACT(MONTH FROM data_hora) as mes,
    tipo_combustivel,
    COUNT(*) as total_abastecimentos,
    SUM(quantidade) as litros_totais,
    SUM(valor_total) as valor_total,
    AVG(valor_unitario) as valor_medio_litro
FROM 
    abastecimentos_posto_campinas_v2
WHERE 
    status = 'ativo'
GROUP BY 
    ano, mes, tipo_combustivel
ORDER BY 
    ano DESC, mes DESC, tipo_combustivel;

-- Criar view para comparativo de combustíveis
CREATE OR REPLACE VIEW view_campinas_v2_comparativo_combustiveis AS
SELECT 
    tipo_combustivel,
    COUNT(*) as total_abastecimentos,
    SUM(quantidade) as litros_totais,
    SUM(valor_total) as valor_total,
    AVG(valor_unitario) as valor_medio_litro
FROM 
    abastecimentos_posto_campinas_v2
WHERE 
    status = 'ativo'
GROUP BY 
    tipo_combustivel
ORDER BY 
    litros_totais DESC;

-- Criar view para os últimos abastecimentos
CREATE OR REPLACE VIEW view_campinas_v2_ultimos_abastecimentos AS
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
    abastecimentos_posto_campinas_v2
WHERE 
    status = 'ativo'
ORDER BY
    data_hora DESC
LIMIT 
    50;

-- Criar view para estatísticas por base
CREATE OR REPLACE VIEW view_campinas_v2_estatisticas_por_base AS
SELECT 
    base,
    COUNT(DISTINCT placa) as total_veiculos,
    COUNT(*) as total_abastecimentos,
    SUM(quantidade) as litros_totais,
    SUM(valor_total) as valor_total,
    AVG(consumo_medio) as media_consumo
FROM 
    abastecimentos_posto_campinas_v2
WHERE 
    status = 'ativo' AND
    base IS NOT NULL
GROUP BY 
    base
ORDER BY 
    litros_totais DESC;

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_abastecimentos_campinas_v2_placa ON abastecimentos_posto_campinas_v2(placa);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_campinas_v2_data_hora ON abastecimentos_posto_campinas_v2(data_hora);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_campinas_v2_tipo_combustivel ON abastecimentos_posto_campinas_v2(tipo_combustivel);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_campinas_v2_base ON abastecimentos_posto_campinas_v2(base);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_campinas_v2_status ON abastecimentos_posto_campinas_v2(status);

-- Confirmar finalização
SELECT 'Tabela e configurações para posto Campinas V2 criadas com sucesso.' as resultado;
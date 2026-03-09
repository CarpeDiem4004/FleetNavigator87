-- Tabela principal para a Oficina Murici
CREATE TABLE oficina_murici_manutencoes (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(10) NOT NULL,
    km INTEGER NOT NULL,
    prazo DATE,
    descricao_manutencao TEXT NOT NULL,
    status VARCHAR(50) CHECK (status IN ('em_andamento', 'aguardando_peca', 'finalizado')) NOT NULL DEFAULT 'em_andamento',
    mecanico VARCHAR(100),
    data_hora_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_hora_fim TIMESTAMP WITH TIME ZONE,
    custo_total DECIMAL(10, 2),
    observacoes TEXT,
    peças_utilizadas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance de consultas
CREATE INDEX idx_mnt_placa ON oficina_murici_manutencoes (placa);
CREATE INDEX idx_mnt_status ON oficina_murici_manutencoes (status);
CREATE INDEX idx_mnt_mecanico ON oficina_murici_manutencoes (mecanico);
CREATE INDEX idx_mnt_data_inicio ON oficina_murici_manutencoes (data_hora_inicio);

-- Tabela para histórico de status das manutenções
CREATE TABLE oficina_murici_historico_status (
    id SERIAL PRIMARY KEY,
    manutencao_id INTEGER REFERENCES oficina_murici_manutencoes(id) ON DELETE CASCADE,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    observacao TEXT,
    data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER,
    usuario_nome VARCHAR(100)
);

-- Trigger para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_oficina_murici_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_oficina_murici_manutencoes_timestamp
BEFORE UPDATE ON oficina_murici_manutencoes
FOR EACH ROW
EXECUTE FUNCTION update_oficina_murici_timestamp();

-- Trigger para registrar mudanças de status no histórico
CREATE OR REPLACE FUNCTION log_oficina_murici_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO oficina_murici_historico_status (
            manutencao_id, 
            status_anterior, 
            status_novo,
            observacao,
            usuario_id
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            'Alteração automática via sistema',
            NULL
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_status_change
AFTER UPDATE ON oficina_murici_manutencoes
FOR EACH ROW
EXECUTE FUNCTION log_oficina_murici_status_changes();

-- View para facilitar relatórios e consultas
CREATE VIEW vw_oficina_murici_manutencoes AS
SELECT 
    m.id,
    m.placa,
    m.km,
    m.prazo,
    m.descricao_manutencao,
    m.status,
    m.mecanico,
    m.data_hora_inicio,
    m.data_hora_fim,
    m.custo_total,
    m.observacoes,
    m.peças_utilizadas,
    CASE 
        WHEN m.status = 'finalizado' THEN TRUE
        ELSE FALSE
    END as concluido,
    CASE 
        WHEN m.data_hora_fim IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (m.data_hora_fim - m.data_hora_inicio))/3600
        ELSE
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - m.data_hora_inicio))/3600
    END as horas_trabalhadas,
    CASE
        WHEN m.prazo IS NOT NULL AND m.status != 'finalizado' AND m.prazo < CURRENT_DATE THEN TRUE
        ELSE FALSE
    END as prazo_vencido
FROM 
    oficina_murici_manutencoes m;

-- Função para registrar finalização de manutenção
CREATE OR REPLACE FUNCTION finalizar_manutencao(
    p_manutencao_id INTEGER,
    p_custo_total DECIMAL(10, 2),
    p_observacoes TEXT DEFAULT NULL,
    p_pecas_utilizadas TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN;
BEGIN
    UPDATE oficina_murici_manutencoes
    SET 
        status = 'finalizado',
        data_hora_fim = CURRENT_TIMESTAMP,
        custo_total = p_custo_total,
        observacoes = COALESCE(p_observacoes, observacoes),
        peças_utilizadas = COALESCE(p_pecas_utilizadas, peças_utilizadas)
    WHERE 
        id = p_manutencao_id;
    
    success := FOUND;
    RETURN success;
END;
$$ LANGUAGE plpgsql;

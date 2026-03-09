-- Tabela para solicitações de orçamentos
CREATE TABLE IF NOT EXISTS budget_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    justification TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    requested_by INTEGER NOT NULL REFERENCES users(id),
    requested_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Campos para o processo de aprovação
    status VARCHAR(30) DEFAULT 'pendente' CHECK (
        status IN ('pendente', 'em_analise', 'aprovado', 'reprovado', 'cancelado')
    ),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    approval_comments TEXT,
    
    -- Documentos e anexos - referência para armazenamento
    documents_url TEXT,
    
    -- Campos para rastreabilidade
    last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_budget_requests_base_id ON budget_requests(base_id);
CREATE INDEX IF NOT EXISTS idx_budget_requests_status ON budget_requests(status);
CREATE INDEX IF NOT EXISTS idx_budget_requests_requested_by ON budget_requests(requested_by);

-- View para visualização de solicitações de orçamento
CREATE OR REPLACE VIEW vw_budget_requests AS
SELECT 
    br.id,
    br.title,
    br.description,
    br.amount,
    br.justification,
    br.category,
    br.status,
    br.requested_at,
    br.approved_at,
    br.approval_comments,
    b.name AS base_name,
    b.id AS base_id,
    req.name AS requested_by_name,
    req.id AS requested_by_id,
    app.name AS approved_by_name,
    app.id AS approved_by_id,
    CASE 
        WHEN br.status = 'pendente' THEN 
            EXTRACT(DAY FROM (NOW() - br.requested_at))
        ELSE 0
    END AS days_pending
FROM budget_requests br
JOIN bases b ON br.base_id = b.id
JOIN users req ON br.requested_by = req.id
LEFT JOIN users app ON br.approved_by = app.id;

-- Histórico de alterações de status
CREATE TABLE IF NOT EXISTS budget_request_history (
    id SERIAL PRIMARY KEY,
    budget_request_id INTEGER NOT NULL REFERENCES budget_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    comments TEXT
);

CREATE INDEX IF NOT EXISTS idx_budget_request_history_request_id 
    ON budget_request_history(budget_request_id);
-- Tabela para gerenciar os alertas no dashboard
CREATE TABLE IF NOT EXISTS dashboard_alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (
        type IN (
            'expense_missing', 'expense_pending', 'maintenance_urgent', 
            'tire_request_pending', 'budget_approval_pending', 'system'
        )
    ),
    base_id INTEGER REFERENCES bases(id) ON DELETE CASCADE,
    reference_id INTEGER, -- ID da entidade relacionada (despesa, manutenção, etc.)
    reference_table VARCHAR(50), -- Tabela da entidade relacionada
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (
        priority IN ('baixa', 'normal', 'alta', 'critica')
    ),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    resolved_notes TEXT
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_type ON dashboard_alerts(type);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_base_id ON dashboard_alerts(base_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_priority ON dashboard_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_resolved ON dashboard_alerts(is_resolved);

-- View para alertas ativos no dashboard
CREATE OR REPLACE VIEW vw_active_dashboard_alerts AS
SELECT 
    a.id,
    a.type,
    a.title,
    a.message,
    a.priority,
    a.created_at,
    a.expires_at,
    a.is_read,
    a.reference_id,
    a.reference_table,
    b.name AS base_name,
    b.id AS base_id,
    CASE 
        WHEN a.type = 'expense_missing' THEN '/bases/' || b.basename || '/despesas'
        WHEN a.type = 'expense_pending' THEN '/bases/' || b.basename || '/despesas'
        WHEN a.type = 'maintenance_urgent' THEN '/bases/' || b.basename || '/manutencao'
        WHEN a.type = 'tire_request_pending' THEN '/bases/' || b.basename || '/pneus'
        WHEN a.type = 'budget_approval_pending' THEN '/bases/' || b.basename || '/orcamentos'
        ELSE '/dashboard'
    END AS alert_link,
    CASE 
        WHEN a.expires_at IS NOT NULL AND a.expires_at < NOW() THEN TRUE
        ELSE FALSE
    END AS is_expired,
    EXTRACT(DAY FROM (NOW() - a.created_at)) AS days_active
FROM dashboard_alerts a
LEFT JOIN bases b ON a.base_id = b.id
WHERE 
    a.is_resolved = FALSE AND
    (a.expires_at IS NULL OR a.expires_at > NOW());

-- Função para criar alerta de despesa pendente automaticamente
CREATE OR REPLACE FUNCTION create_expense_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a base não tiver registro de despesa para o mês atual
    INSERT INTO dashboard_alerts (
        type, base_id, title, message, priority, 
        reference_table, reference_id
    )
    VALUES (
        'expense_missing', NEW.base_id,
        'Despesas não registradas', 
        'A base ' || (SELECT name FROM bases WHERE id = NEW.base_id) || 
        ' não registrou as despesas para ' || 
        TO_CHAR(TO_DATE(NEW.month::text, 'MM'), 'TMMonth') || '/' || NEW.year,
        'alta', 
        'base_expenses', NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar alerta automaticamente
CREATE OR REPLACE TRIGGER expense_alert_trigger
AFTER INSERT ON base_expenses
FOR EACH ROW
WHEN (NEW.status = 'pendente')
EXECUTE FUNCTION create_expense_alert();
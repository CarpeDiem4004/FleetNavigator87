-- Tabelas SQL para melhorias adicionais do sistema

-- 1. Tabela para auditoria de mudanças críticas
CREATE TABLE IF NOT EXISTS system_audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    reason TEXT
);

-- 2. Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false, -- Se pode ser acessado pelo frontend
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela para backups e sincronização de dados
CREATE TABLE IF NOT EXISTS data_sync_log (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL, -- 'backup', 'restore', 'migration'
    table_name VARCHAR(100),
    records_affected INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    file_path TEXT,
    file_size INTEGER,
    checksum VARCHAR(64),
    triggered_by INTEGER REFERENCES users(id)
);

-- 4. Tabela para relatórios personalizados
CREATE TABLE IF NOT EXISTS custom_reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(200) NOT NULL,
    description TEXT,
    sql_query TEXT NOT NULL,
    parameters JSONB, -- Parâmetros do relatório
    output_format VARCHAR(20) DEFAULT 'json', -- 'json', 'csv', 'xlsx'
    schedule_expression VARCHAR(100), -- Cron expression para relatórios agendados
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(50),
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela para cache de consultas pesadas
CREATE TABLE IF NOT EXISTS query_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    query_hash VARCHAR(64) NOT NULL,
    result_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela para monitoramento de performance
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20), -- 'ms', 'seconds', 'mb', 'count'
    endpoint VARCHAR(200),
    method VARCHAR(10),
    user_id INTEGER REFERENCES users(id),
    execution_time DECIMAL(10,4),
    memory_usage INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela para alertas do sistema
CREATE TABLE IF NOT EXISTS system_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- 'performance', 'security', 'data', 'system'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela para jobs/tarefas agendadas
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL UNIQUE,
    job_type VARCHAR(50) NOT NULL, -- 'report', 'cleanup', 'sync', 'backup'
    schedule_expression VARCHAR(100) NOT NULL, -- Cron expression
    job_config JSONB,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(50),
    last_run_duration INTEGER, -- em segundos
    next_run_at TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela para templates de email/notificação
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push', 'system'
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB, -- Variáveis disponíveis no template
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Inserir configurações padrão do sistema
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
('app_name', 'Sistema de Gestão de Frotas', 'string', 'Nome da aplicação', 'general', true),
('app_version', '2.0.0', 'string', 'Versão atual do sistema', 'general', true),
('maintenance_mode', 'false', 'boolean', 'Modo de manutenção ativo', 'system', false),
('max_file_upload_size', '10485760', 'number', 'Tamanho máximo de upload em bytes (10MB)', 'uploads', false),
('session_timeout', '2592000', 'number', 'Timeout de sessão em segundos (30 dias)', 'security', false),
('backup_retention_days', '30', 'number', 'Dias para manter backups', 'backup', false),
('timezone', 'America/Sao_Paulo', 'string', 'Fuso horário padrão do sistema', 'general', true),
('date_format', 'DD/MM/YYYY', 'string', 'Formato de data padrão', 'general', true),
('currency', 'BRL', 'string', 'Moeda padrão', 'general', true),
('company_name', 'Murici Logística', 'string', 'Nome da empresa', 'general', true)
ON CONFLICT (setting_key) DO NOTHING;

-- 11. Inserir templates de notificação padrão
INSERT INTO notification_templates (template_name, template_type, subject_template, body_template, variables) VALUES
('partner_login_success', 'system', 'Login realizado com sucesso', 'Olá {{partner_name}}, você realizou login no sistema em {{login_time}}.', '{"partner_name": "Nome do parceiro", "login_time": "Data/hora do login"}'),
('service_request_created', 'email', 'Nova solicitação de serviço #{{request_id}}', 'Uma nova solicitação de serviço foi criada para o veículo {{vehicle_plate}} na localização {{location}}.', '{"request_id": "ID da solicitação", "vehicle_plate": "Placa do veículo", "location": "Localização"}'),
('service_completed', 'system', 'Serviço concluído', 'O serviço #{{request_id}} foi concluído com sucesso pelo parceiro {{partner_name}}.', '{"request_id": "ID da solicitação", "partner_name": "Nome do parceiro"}'),
('document_uploaded', 'system', 'Documento enviado', 'Seu documento {{document_type}} foi enviado e está aguardando verificação.', '{"document_type": "Tipo do documento"}'),
('payment_processed', 'email', 'Pagamento processado', 'O pagamento de R$ {{amount}} para o serviço #{{service_id}} foi processado com sucesso.', '{"amount": "Valor do pagamento", "service_id": "ID do serviço"}')
ON CONFLICT (template_name) DO NOTHING;

-- 12. Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_audit_log_table_record ON system_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_changed_at ON system_audit_log(changed_at);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

CREATE INDEX IF NOT EXISTS idx_data_sync_log_sync_type ON data_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_status ON data_sync_log(status);

CREATE INDEX IF NOT EXISTS idx_query_cache_key ON query_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_query_cache_expires ON query_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_system_alerts_type_severity ON system_alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(is_resolved);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_active ON scheduled_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at);

-- 13. Triggers para auditoria automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO system_audit_log (table_name, record_id, action, old_values, changed_at)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), NOW());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO system_audit_log (table_name, record_id, action, old_values, new_values, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO system_audit_log (table_name, record_id, action, new_values, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 14. Função para limpeza automática de cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 15. View para estatísticas do sistema
CREATE OR REPLACE VIEW system_statistics AS
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as records_last_30_days
FROM users
UNION ALL
SELECT 
    'towing_partners' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as records_last_30_days
FROM towing_partners
UNION ALL
SELECT 
    'towing_service_requests' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as records_last_30_days
FROM towing_service_requests;

COMMENT ON TABLE system_audit_log IS 'Log de auditoria para rastreamento de mudanças críticas';
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema';
COMMENT ON TABLE data_sync_log IS 'Log de sincronização e backup de dados';
COMMENT ON TABLE custom_reports IS 'Relatórios personalizados criados pelos usuários';
COMMENT ON TABLE query_cache IS 'Cache de consultas para melhorar performance';
COMMENT ON TABLE performance_metrics IS 'Métricas de performance do sistema';
COMMENT ON TABLE system_alerts IS 'Alertas e notificações do sistema';
COMMENT ON TABLE scheduled_jobs IS 'Jobs e tarefas agendadas';
COMMENT ON TABLE notification_templates IS 'Templates para notificações e emails';
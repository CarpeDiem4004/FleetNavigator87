-- Tabelas SQL para novas funcionalidades do sistema de parceiros

-- 1. Tabela de sessões de parceiros (para controle de acesso)
CREATE TABLE IF NOT EXISTS partner_sessions (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de logs de acesso dos parceiros
CREATE TABLE IF NOT EXISTS partner_access_logs (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'view_services', 'update_profile'
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de notificações para parceiros
CREATE TABLE IF NOT EXISTS partner_notifications (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 4. Tabela de documentos dos parceiros
CREATE TABLE IF NOT EXISTS partner_documents (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    document_type VARCHAR(100) NOT NULL, -- 'cnpj', 'alvara', 'seguro', 'certificado'
    document_name VARCHAR(200) NOT NULL,
    file_path TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 5. Tabela de avaliações de serviços dos parceiros
CREATE TABLE IF NOT EXISTS partner_service_ratings (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES towing_service_requests(id),
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response_time_rating INTEGER CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
    service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de configurações dos parceiros
CREATE TABLE IF NOT EXISTS partner_settings (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id) UNIQUE,
    notification_email BOOLEAN DEFAULT true,
    notification_sms BOOLEAN DEFAULT false,
    auto_accept_requests BOOLEAN DEFAULT false,
    working_hours_start TIME DEFAULT '08:00:00',
    working_hours_end TIME DEFAULT '18:00:00',
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Segunda, 7=Domingo
    max_distance_km INTEGER DEFAULT 50,
    emergency_contact_phone VARCHAR(20),
    backup_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de histórico de atualizações de status dos parceiros
CREATE TABLE IF NOT EXISTS partner_status_history (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- 8. Tabela de comunicações/mensagens entre sistema e parceiros
CREATE TABLE IF NOT EXISTS partner_messages (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    sender_type VARCHAR(20) NOT NULL, -- 'system', 'partner', 'operator'
    sender_id INTEGER, -- NULL para system, partner_id ou user_id
    subject VARCHAR(200),
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general', -- 'general', 'service_request', 'payment', 'alert'
    reference_id INTEGER, -- ID de referência (serviço, pagamento, etc.)
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 9. Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_partner_sessions_partner_id ON partner_sessions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_sessions_token ON partner_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_partner_sessions_active ON partner_sessions(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_partner_access_logs_partner_id ON partner_access_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_access_logs_created_at ON partner_access_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_id ON partner_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_unread ON partner_notifications(partner_id, is_read);

CREATE INDEX IF NOT EXISTS idx_partner_documents_partner_id ON partner_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_documents_type ON partner_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_partner_documents_status ON partner_documents(status);

CREATE INDEX IF NOT EXISTS idx_partner_messages_partner_id ON partner_messages(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_unread ON partner_messages(partner_id, is_read);

-- 10. Triggers para atualização automática de timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partner_settings_updated_at 
    BEFORE UPDATE ON partner_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Função para limpeza automática de sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_partner_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM partner_sessions 
    WHERE expires_at < NOW() OR (last_activity < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 12. View para estatísticas dos parceiros
CREATE OR REPLACE VIEW partner_statistics AS
SELECT 
    tp.id,
    tp.name,
    tp.status,
    COUNT(tsr.id) as total_services,
    COUNT(CASE WHEN tsr.status = 'completed' THEN 1 END) as completed_services,
    COUNT(CASE WHEN tsr.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as services_last_30_days,
    COALESCE(AVG(psr.rating), 0) as average_rating,
    COUNT(psr.id) as total_ratings,
    MAX(tsr.completed_at) as last_service_date,
    COUNT(CASE WHEN pal.action = 'login' AND pal.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as logins_last_30_days
FROM towing_partners tp
LEFT JOIN towing_service_requests tsr ON tp.id = tsr.partner_id
LEFT JOIN partner_service_ratings psr ON tp.id = psr.partner_id
LEFT JOIN partner_access_logs pal ON tp.id = pal.partner_id
GROUP BY tp.id, tp.name, tp.status;

COMMENT ON TABLE partner_sessions IS 'Controle de sessões ativas dos parceiros para segurança';
COMMENT ON TABLE partner_access_logs IS 'Log de todas as ações realizadas pelos parceiros no sistema';
COMMENT ON TABLE partner_notifications IS 'Notificações do sistema para os parceiros';
COMMENT ON TABLE partner_documents IS 'Documentos enviados pelos parceiros para verificação';
COMMENT ON TABLE partner_service_ratings IS 'Avaliações dos serviços prestados pelos parceiros';
COMMENT ON TABLE partner_settings IS 'Configurações personalizadas de cada parceiro';
COMMENT ON TABLE partner_status_history IS 'Histórico de mudanças de status dos parceiros';
COMMENT ON TABLE partner_messages IS 'Sistema de mensagens entre operadores e parceiros';
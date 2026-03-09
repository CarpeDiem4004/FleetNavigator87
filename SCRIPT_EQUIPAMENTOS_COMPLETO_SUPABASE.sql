-- SCRIPT COMPLETO PARA SISTEMA DE CONTROLE DE EQUIPAMENTOS NO SUPABASE
-- Execute este script no Editor SQL do Supabase para garantir que todas as estruturas estejam disponíveis
-- Data: 10 de julho de 2025

-- ============================================================================
-- 1. CRIAÇÃO DOS ENUMS NECESSÁRIOS
-- ============================================================================

-- Enum para tipos de equipamentos
DO $$ BEGIN
    CREATE TYPE equipment_type AS ENUM (
        'notebook',
        'celular',
        'tablet',
        'desktop',
        'monitor',
        'impressora',
        'scanner',
        'roteador',
        'telefone_fixo',
        'camera',
        'projetor',
        'outros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status dos equipamentos
DO $$ BEGIN
    CREATE TYPE equipment_status AS ENUM (
        'disponivel',
        'em_uso',
        'manutencao',
        'descartado',
        'perdido',
        'roubado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para condições dos equipamentos
DO $$ BEGIN
    CREATE TYPE equipment_condition AS ENUM (
        'novo',
        'otimo',
        'bom',
        'regular',
        'ruim',
        'defeituoso'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABELA PRINCIPAL DE EQUIPAMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type equipment_type NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    patrimony_number TEXT,
    purchase_date DATE,
    purchase_value NUMERIC(10,2),
    supplier TEXT,
    warranty_expires DATE,
    condition equipment_condition NOT NULL DEFAULT 'novo',
    status equipment_status NOT NULL DEFAULT 'disponivel',
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_equipments_type ON equipments(type);
CREATE INDEX IF NOT EXISTS idx_equipments_status ON equipments(status);
CREATE INDEX IF NOT EXISTS idx_equipments_condition ON equipments(condition);
CREATE INDEX IF NOT EXISTS idx_equipments_serial ON equipments(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipments_patrimony ON equipments(patrimony_number);

-- ============================================================================
-- 3. TABELA DE MANUTENÇÃO DE EQUIPAMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_maintenance (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    maintenance_type TEXT NOT NULL,
    description TEXT NOT NULL,
    performed_by TEXT,
    performed_at TIMESTAMP DEFAULT NOW(),
    cost NUMERIC(10,2),
    supplier TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment_id ON equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_date ON equipment_maintenance(performed_at);

-- ============================================================================
-- 4. TABELA DE MOVIMENTAÇÃO DE EQUIPAMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_movements (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    from_location TEXT,
    to_location TEXT,
    movement_type TEXT NOT NULL, -- 'assignment', 'return', 'transfer', 'maintenance'
    moved_by INTEGER NOT NULL REFERENCES users(id),
    moved_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_equipment_movements_equipment_id ON equipment_movements(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_movements_from_user ON equipment_movements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_movements_to_user ON equipment_movements(to_user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_movements_date ON equipment_movements(moved_at);

-- ============================================================================
-- 5. TABELA DE TERMOS DE RESPONSABILIDADE
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_responsibility_terms (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    full_name TEXT,
    cpf TEXT,
    phone TEXT,
    department TEXT,
    address TEXT,
    assigned_at TIMESTAMP DEFAULT NOW(),
    returned_at TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    returned_by INTEGER REFERENCES users(id),
    term_content TEXT NOT NULL,
    user_signature TEXT,
    manager_signature TEXT,
    condition_at_assignment equipment_condition NOT NULL,
    condition_at_return equipment_condition,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_equipment_responsibility_equipment_id ON equipment_responsibility_terms(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_responsibility_user_id ON equipment_responsibility_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_responsibility_active ON equipment_responsibility_terms(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_responsibility_cpf ON equipment_responsibility_terms(cpf);

-- ============================================================================
-- 6. TABELA DE EQUIPAMENTOS DE PARCEIROS (JÁ EXISTENTE)
-- ============================================================================

-- Esta tabela já existe e está sendo usada para equipamentos de parceiros de guincho
-- Não será modificada para manter a compatibilidade

-- ============================================================================
-- 7. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para equipments
DROP TRIGGER IF EXISTS update_equipments_updated_at ON equipments;
CREATE TRIGGER update_equipments_updated_at
    BEFORE UPDATE ON equipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para equipment_maintenance
DROP TRIGGER IF EXISTS update_equipment_maintenance_updated_at ON equipment_maintenance;
CREATE TRIGGER update_equipment_maintenance_updated_at
    BEFORE UPDATE ON equipment_maintenance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para equipment_responsibility_terms
DROP TRIGGER IF EXISTS update_equipment_responsibility_terms_updated_at ON equipment_responsibility_terms;
CREATE TRIGGER update_equipment_responsibility_terms_updated_at
    BEFORE UPDATE ON equipment_responsibility_terms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. FUNÇÃO PARA REGISTRAR MOVIMENTAÇÕES AUTOMÁTICAS
-- ============================================================================

CREATE OR REPLACE FUNCTION register_equipment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Registra movimentação quando o status muda
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO equipment_movements (
            equipment_id,
            from_location,
            to_location,
            movement_type,
            moved_by,
            notes
        ) VALUES (
            NEW.id,
            OLD.location,
            NEW.location,
            'status_change',
            1, -- Usuário padrão do sistema
            'Status alterado de ' || OLD.status || ' para ' || NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para registrar mudanças de status
DROP TRIGGER IF EXISTS equipment_status_change_trigger ON equipments;
CREATE TRIGGER equipment_status_change_trigger
    AFTER UPDATE ON equipments
    FOR EACH ROW
    EXECUTE FUNCTION register_equipment_status_change();

-- ============================================================================
-- 9. VIEWS PARA RELATÓRIOS
-- ============================================================================

-- View para equipamentos com informações do usuário responsável
CREATE OR REPLACE VIEW equipment_with_user AS
SELECT 
    e.*,
    u.name as current_user_name,
    u.email as current_user_email,
    rt.full_name as responsible_person_name,
    rt.cpf as responsible_person_cpf,
    rt.phone as responsible_person_phone,
    rt.department as responsible_person_department,
    rt.assigned_at as assigned_date
FROM equipments e
LEFT JOIN equipment_responsibility_terms rt ON e.id = rt.equipment_id AND rt.is_active = true
LEFT JOIN users u ON rt.user_id = u.id;

-- View para estatísticas de equipamentos
CREATE OR REPLACE VIEW equipment_statistics AS
SELECT 
    COUNT(*) as total_equipments,
    COUNT(CASE WHEN status = 'disponivel' THEN 1 END) as available_count,
    COUNT(CASE WHEN status = 'em_uso' THEN 1 END) as in_use_count,
    COUNT(CASE WHEN status = 'manutencao' THEN 1 END) as maintenance_count,
    COUNT(CASE WHEN status = 'descartado' THEN 1 END) as discarded_count,
    COUNT(CASE WHEN status = 'perdido' THEN 1 END) as lost_count,
    COUNT(CASE WHEN status = 'roubado' THEN 1 END) as stolen_count,
    SUM(purchase_value) as total_value,
    AVG(purchase_value) as average_value
FROM equipments;

-- View para equipamentos próximos do vencimento da garantia
CREATE OR REPLACE VIEW equipment_warranty_expiring AS
SELECT 
    e.*,
    (warranty_expires - CURRENT_DATE) as days_to_expire
FROM equipments e
WHERE warranty_expires IS NOT NULL 
    AND warranty_expires > CURRENT_DATE 
    AND warranty_expires <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY warranty_expires;

-- ============================================================================
-- 10. POLÍTICAS DE SEGURANÇA RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilita RLS para as tabelas
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_responsibility_terms ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total aos administradores
CREATE POLICY "Admins can do everything on equipments" ON equipments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything on equipment_maintenance" ON equipment_maintenance
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything on equipment_movements" ON equipment_movements
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything on equipment_responsibility_terms" ON equipment_responsibility_terms
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Política para permitir leitura aos usuários autenticados
CREATE POLICY "Authenticated users can read equipments" ON equipments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read equipment_maintenance" ON equipment_maintenance
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read equipment_movements" ON equipment_movements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read equipment_responsibility_terms" ON equipment_responsibility_terms
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- 11. DADOS INICIAIS DE EXEMPLO (OPCIONAL)
-- ============================================================================

-- Inserir alguns equipamentos de exemplo (descomente se necessário)
/*
INSERT INTO equipments (name, type, brand, model, condition, status, location) VALUES
('Notebook Dell Admin', 'notebook', 'Dell', 'Latitude 5520', 'novo', 'disponivel', 'Almoxarifado'),
('iPhone 13 Pro', 'celular', 'Apple', 'iPhone 13 Pro', 'otimo', 'disponivel', 'Almoxarifado'),
('Impressora HP LaserJet', 'impressora', 'HP', 'LaserJet Pro M404n', 'novo', 'disponivel', 'Escritório'),
('Monitor Samsung 27"', 'monitor', 'Samsung', 'F27T450FQN', 'novo', 'disponivel', 'Almoxarifado'),
('Roteador TP-Link', 'roteador', 'TP-Link', 'Archer C6', 'bom', 'em_uso', 'Escritório Principal');
*/

-- ============================================================================
-- 12. COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON TABLE equipments IS 'Tabela principal para controle de equipamentos da empresa';
COMMENT ON TABLE equipment_maintenance IS 'Histórico de manutenções realizadas nos equipamentos';
COMMENT ON TABLE equipment_movements IS 'Registro de movimentações e transferências de equipamentos';
COMMENT ON TABLE equipment_responsibility_terms IS 'Termos de responsabilidade e atribuição de equipamentos';

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Para verificar se tudo foi criado corretamente, execute:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%equipment%';
-- SELECT typname FROM pg_type WHERE typname LIKE '%equipment%';
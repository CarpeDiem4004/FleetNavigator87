-- ============================================================================
-- CORREÇÕES FINAIS DO SISTEMA DE MANUTENÇÃO - SOLUÇÃO COMPLETA
-- Este script corrige todos os problemas de chaves estrangeiras
-- ============================================================================

-- 1. VERIFICAR E CORRIGIR TABELA maintenance_labor
-- Problema: pode ter referência a users(id) que não existe para technician_id
ALTER TABLE maintenance_labor DROP CONSTRAINT IF EXISTS maintenance_labor_technician_id_fkey;
ALTER TABLE maintenance_labor ADD CONSTRAINT maintenance_labor_technician_id_fkey 
FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL;

-- 2. VERIFICAR E CORRIGIR TABELA maintenance_schedules
-- Problema: pode ter referência a vehicles(id) que não existe
-- Primeiro, vamos verificar se a tabela vehicles tem dados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vehicles LIMIT 1) THEN
        -- Inserir dados básicos de veículos se não existirem
        INSERT INTO vehicles (id, plate, model, status, vehicleType, baseId) VALUES 
        (1, 'ABC-1234', 'Fiorino', 'em_operacao', 'van', 1),
        (2, 'DEF-5678', 'Sprinter', 'em_operacao', 'van', 2),
        (3, 'GHI-9012', 'Daily', 'em_operacao', 'van', 1)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 3. VERIFICAR E CORRIGIR TABELA maintenance_approvals
-- Garantir que todas as aprovações tenham referências válidas
ALTER TABLE maintenance_approvals DROP CONSTRAINT IF EXISTS maintenance_approvals_approver_id_fkey;
ALTER TABLE maintenance_approvals ADD CONSTRAINT maintenance_approvals_approver_id_fkey 
FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. VERIFICAR E CORRIGIR TABELA maintenance_status_history
ALTER TABLE maintenance_status_history DROP CONSTRAINT IF EXISTS maintenance_status_history_changed_by_fkey;
ALTER TABLE maintenance_status_history ADD CONSTRAINT maintenance_status_history_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 5. VERIFICAR E CORRIGIR TABELA workshop_service_ratings
ALTER TABLE workshop_service_ratings DROP CONSTRAINT IF EXISTS workshop_service_ratings_rated_by_fkey;
ALTER TABLE workshop_service_ratings ADD CONSTRAINT workshop_service_ratings_rated_by_fkey 
FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE SET NULL;

-- 6. VERIFICAR E CORRIGIR TABELA maintenance_audit_log
ALTER TABLE maintenance_audit_log DROP CONSTRAINT IF EXISTS maintenance_audit_log_changed_by_fkey;
ALTER TABLE maintenance_audit_log ADD CONSTRAINT maintenance_audit_log_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- INSERIR DADOS DE EXEMPLO PARA DEMONSTRAÇÃO
-- ============================================================================

-- Inserir cronogramas de manutenção preventiva para os veículos
INSERT INTO maintenance_schedules (vehicle_id, service_type, service_category, interval_km, interval_months, next_service_km, next_service_date, priority_level, estimated_cost) VALUES
(1, 'Troca de Óleo', 'Preventiva', 5000, 3, 45000, CURRENT_DATE + INTERVAL '30 days', 2, 250.00),
(1, 'Revisão de Freios', 'Preventiva', 20000, 12, 60000, CURRENT_DATE + INTERVAL '90 days', 3, 800.00),
(2, 'Troca de Óleo', 'Preventiva', 5000, 3, 35000, CURRENT_DATE + INTERVAL '15 days', 2, 250.00),
(3, 'Revisão Geral', 'Preventiva', 10000, 6, 50000, CURRENT_DATE + INTERVAL '60 days', 2, 600.00)
ON CONFLICT DO NOTHING;

-- Inserir especialidades das oficinas
INSERT INTO workshop_specialties (workshop_id, specialty_type, certification_level, certified_until, hourly_rate, is_active) VALUES
(1, 'Motor', 'Certificado', '2025-12-31', 120.00, true),
(1, 'Freios', 'Especialista', '2025-12-31', 100.00, true),
(1, 'Transmissão', 'Básico', '2025-12-31', 90.00, true),
(2, 'Elétrica', 'Especialista', '2025-12-31', 150.00, true),
(2, 'Ar Condicionado', 'Certificado', '2025-12-31', 110.00, true)
ON CONFLICT DO NOTHING;

-- Inserir histórico de status para as manutenções existentes
INSERT INTO maintenance_status_history (maintenance_id, old_status, new_status, changed_by, changed_at, notes) VALUES
(1, null, 'pendente', 1, NOW() - INTERVAL '2 days', 'Solicitação de manutenção criada'),
(2, null, 'pendente', 1, NOW() - INTERVAL '1 day', 'Solicitação de manutenção criada'),
(2, 'pendente', 'em_andamento', 1, NOW() - INTERVAL '12 hours', 'Manutenção iniciada na oficina'),
(3, null, 'pendente', 1, NOW() - INTERVAL '3 days', 'Solicitação de manutenção criada'),
(3, 'pendente', 'em_andamento', 1, NOW() - INTERVAL '2 days', 'Manutenção iniciada'),
(3, 'em_andamento', 'concluida', 1, NOW() - INTERVAL '1 day', 'Manutenção finalizada')
ON CONFLICT DO NOTHING;

-- Inserir custos detalhados para as manutenções
INSERT INTO maintenance_costs (maintenance_id, cost_type, description, estimated_cost, actual_cost, supplier_name, payment_status) VALUES
(1, 'parts', 'Óleo lubrificante 5W30', 80.00, 85.00, 'Auto Peças São Paulo', 'pending'),
(1, 'labor', 'Mão de obra troca de óleo', 50.00, 50.00, 'Oficina Mecânica São Paulo LTDA', 'pending'),
(2, 'parts', 'Pastilhas de freio dianteira', 300.00, 320.00, 'Freios & Cia', 'pending'),
(2, 'labor', 'Mão de obra sistema de freios', 200.00, 180.00, 'Auto Center Rio de Janeiro LTDA', 'pending'),
(3, 'parts', 'Kit revisão 10.000km', 250.00, 240.00, 'Auto Peças São Paulo', 'paid'),
(3, 'labor', 'Mão de obra revisão completa', 150.00, 150.00, 'Oficina Mecânica São Paulo LTDA', 'paid')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICAÇÃO FINAL DAS TABELAS
-- ============================================================================

SELECT 
    'SISTEMA DE MANUTENÇÃO COMPLETO' as status,
    COUNT(DISTINCT table_name) as tabelas_criadas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'maintenance_%'
OR table_name LIKE 'workshop_%'
OR table_name LIKE 'vehicle_maintenance_%';

-- Verificar dados inseridos
SELECT 
    'DADOS INSERIDOS' as info,
    'maintenance_categories' as tabela,
    COUNT(*) as registros
FROM maintenance_categories
UNION ALL
SELECT 
    'DADOS INSERIDOS' as info,
    'maintenance_templates' as tabela,
    COUNT(*) as registros
FROM maintenance_templates
UNION ALL
SELECT 
    'DADOS INSERIDOS' as info,
    'maintenance_schedules' as tabela,
    COUNT(*) as registros
FROM maintenance_schedules
UNION ALL
SELECT 
    'DADOS INSERIDOS' as info,
    'workshop_specialties' as tabela,
    COUNT(*) as registros
FROM workshop_specialties;

-- Testar consulta completa do sistema
SELECT 
    'TESTE SISTEMA COMPLETO' as teste,
    m.id,
    m.placa,
    m.descricao,
    m.status,
    o.razao_social as oficina,
    b.name as base,
    (SELECT COUNT(*) FROM maintenance_costs WHERE maintenance_id = m.id) as custos_detalhados,
    (SELECT COUNT(*) FROM maintenance_status_history WHERE maintenance_id = m.id) as historico_status
FROM manutencao m
LEFT JOIN oficinas o ON m.oficina_id = o.id
LEFT JOIN bases b ON m.base_id = b.id
ORDER BY m.id;
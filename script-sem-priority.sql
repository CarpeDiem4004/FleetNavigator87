-- SCRIPT SIMPLES sem priority problemática  
-- Execute no Supabase SQL Editor

-- Limpar dados
DELETE FROM campinas_budget_requests WHERE id > 0;

-- Inserir apenas com colunas básicas obrigatórias
INSERT INTO campinas_budget_requests (
    title,
    description,
    requester_id,
    requested_by,
    requester_name,
    vehicle_plate,
    vehicle_model,
    workshop_id,
    workshop_name,
    base_id,
    status,
    estimated_value,
    department
) VALUES
('Manutenção Mercedes ABC1234', 'Revisão completa do sistema de freios', 1, 1, 'Administrador Sistema', 'ABC1234', 'Mercedes Actros', 3, 'Oficina Mestre Auto', 46, 'pendente', 2500.00, 'manutencao'),
('Reparo Volvo DEF5678', 'Reparo no sistema elétrico', 1, 1, 'Administrador Sistema', 'DEF5678', 'Volvo FH', 4, 'Auto Socorro Premium', 47, 'aprovado', 1800.00, 'manutencao'),
('Manutenção Scania GHI9012', 'Troca de filtros e fluidos', 1, 1, 'Administrador Sistema', 'GHI9012', 'Scania R450', 5, 'Oficina ABC', 46, 'em_analise', 3200.00, 'manutencao'),
('Reparo Mercedes JKL3456', 'Sistema de suspensão', 1, 1, 'Administrador Sistema', 'JKL3456', 'Mercedes Atego', 6, 'Oficina Murici', 47, 'pendente', 4500.00, 'manutencao'),
('Manutenção Iveco MNO7890', 'Troca de embreagem', 1, 1, 'Administrador Sistema', 'MNO7890', 'Iveco Daily', 11, 'AUTO MECÂNICA PASSOS', 46, 'aprovado', 5200.00, 'manutencao'),
('Revisão Ford PQR1234', 'Revisão 20.000 km', 1, 1, 'Administrador Sistema', 'PQR1234', 'Ford Cargo', 2, 'Alair Manutenção', 47, 'pendente', 2800.00, 'manutencao'),
('Reparo VW STU5678', 'Direção hidráulica', 1, 1, 'Administrador Sistema', 'STU5678', 'VW Delivery', 12, 'AUTOFREI', 46, 'em_analise', 1950.00, 'manutencao'),
('Manutenção Man VWX9012', 'Sistema arrefecimento', 1, 1, 'Administrador Sistema', 'VWX9012', 'Man TGX', 3, 'Oficina Mestre Auto', 47, 'aprovado', 3400.00, 'manutencao');

-- Atualizar aprovados
UPDATE campinas_budget_requests 
SET approved_value = ROUND(estimated_value * 0.9, 2),
    approved_by = 1,
    approver_name = 'Administrador Sistema'
WHERE status = 'aprovado';

-- Resultado
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    SUM(estimated_value) as valor_total
FROM campinas_budget_requests;

SELECT '✅ DADOS INSERIDOS SEM PRIORITY - deve funcionar!' as resultado;
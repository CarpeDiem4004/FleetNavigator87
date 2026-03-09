-- Script para corrigir qualquer problema com a coluna placa na tabela oficina_murici_manutencoes

-- 1. Testar se conseguimos fazer SELECT na tabela
SELECT id, placa, status, custo_total FROM oficina_murici_manutencoes LIMIT 1;

-- 2. Testar INSERT básico
INSERT INTO oficina_murici_manutencoes (
    placa, 
    km, 
    prazo, 
    descricao_manutencao, 
    status, 
    mecanico, 
    custo_total
) VALUES (
    'TEST-9999', 
    1000, 
    '2024-12-31', 
    'Teste de funcionamento', 
    'em_andamento', 
    'Sistema', 
    100.00
) RETURNING id, placa, status;

-- 3. Testar UPDATE
UPDATE oficina_murici_manutencoes 
SET custo_total = 150.00 
WHERE placa = 'TEST-9999';

-- 4. Testar SELECT com todos os campos
SELECT 
    id,
    placa,
    km,
    prazo,
    descricao_manutencao,
    status,
    mecanico,
    custo_total,
    observacoes,
    peças_utilizadas,
    data_hora_inicio,
    data_hora_fim,
    created_at,
    updated_at,
    peca_descricao,
    peca_valor,
    fornecedor_nome,
    fornecedor_telefone,
    prazo_entrega
FROM oficina_murici_manutencoes 
WHERE placa = 'TEST-9999';

-- 5. Limpar dados de teste
DELETE FROM oficina_murici_manutencoes WHERE placa = 'TEST-9999';
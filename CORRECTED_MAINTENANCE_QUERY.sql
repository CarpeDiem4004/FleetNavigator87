-- CONSULTA CORRIGIDA PARA O SISTEMA DE MANUTENÇÃO
-- Esta query funciona corretamente com a estrutura atual do banco

-- Consulta principal de manutenções (como usada pela API)
SELECT 
    m.id,
    m.placa,
    m.descricao,
    m.status,
    m.prioridade,
    m.responsavel,
    m.custo,
    o.razao_social as oficina_nome,
    b.name as base_nome
FROM manutencao m
LEFT JOIN oficinas o ON m.oficina_id = o.id
LEFT JOIN bases b ON m.base_id = b.id
ORDER BY m.data_solicitacao DESC;

-- Consulta de oficinas (como usada pela API)
SELECT 
    id,
    razao_social,
    nome_fantasia,
    cnpj,
    status,
    tipo,
    endereco,
    telefone,
    email,
    responsavel
FROM oficinas
WHERE status = 'ativo'
ORDER BY created_at DESC;

-- Se você está tentando executar uma query diferente, use uma destas versões testadas:

-- Versão simples para teste
SELECT 
    m.id,
    m.placa,
    m.descricao,
    m.status
FROM manutencao m;

-- Versão com join apenas para oficinas
SELECT 
    m.id,
    m.placa,
    m.descricao,
    m.status,
    o.razao_social as oficina_nome
FROM manutencao m
LEFT JOIN oficinas o ON m.oficina_id = o.id;

-- Verificar estrutura da tabela se ainda houver dúvidas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'manutencao' 
ORDER BY ordinal_position;
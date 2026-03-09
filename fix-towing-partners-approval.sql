-- Script para corrigir a restrição de chave estrangeira que está impedindo a aprovação de parceiros

-- Verificar as restrições existentes
SELECT
  tc.constraint_name,
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'towing_requests';

-- Modificar a restrição de chave estrangeira para permitir atualização em cascata
ALTER TABLE towing_requests 
DROP CONSTRAINT IF EXISTS towing_requests_partner_id_fkey;

ALTER TABLE towing_requests
ADD CONSTRAINT towing_requests_partner_id_fkey
FOREIGN KEY (partner_id)
REFERENCES towing_partners(id)
ON UPDATE CASCADE;

-- Realizar manutenção na tabela para garantir consistência
VACUUM ANALYZE towing_partners;
VACUUM ANALYZE towing_requests;

-- Atualizar o status para "ativo" para os parceiros pendentes
UPDATE towing_partners
SET status = 'ativo', updated_at = NOW()
WHERE status = 'pendente';

-- Verificar se as atualizações foram aplicadas
SELECT id, name, status FROM towing_partners ORDER BY id;
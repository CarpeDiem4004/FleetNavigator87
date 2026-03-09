-- Script para adicionar a coluna oficina_id na tabela manutencao
-- Esta coluna é necessária para relacionar manutenções com oficinas

-- Adicionar a coluna oficina_id se ela não existir
ALTER TABLE manutencao 
ADD COLUMN IF NOT EXISTS oficina_id INTEGER;

-- Criar o índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_manutencao_oficina_id ON manutencao(oficina_id);

-- Adicionar a constraint de foreign key para oficinas (opcional)
-- Descomente a linha abaixo se quiser enforçar a integridade referencial
-- ALTER TABLE manutencao ADD CONSTRAINT fk_manutencao_oficina FOREIGN KEY (oficina_id) REFERENCES oficinas(id);

-- Verificar a estrutura da tabela após a alteração
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'manutencao' 
ORDER BY ordinal_position;

-- Verificar se a coluna foi criada corretamente
SELECT 'oficina_id column added successfully' as status;
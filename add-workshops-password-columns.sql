-- Script para adicionar colunas de senha e último login na tabela workshops
-- Execute este script no Supabase ou PostgreSQL

-- Adicionar coluna de senha para autenticação das oficinas
ALTER TABLE workshops 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Adicionar coluna para registrar último login
ALTER TABLE workshops 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Adicionar coluna updated_at se não existir
ALTER TABLE workshops 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at na tabela workshops
DROP TRIGGER IF EXISTS update_workshops_updated_at ON workshops;
CREATE TRIGGER update_workshops_updated_at 
    BEFORE UPDATE ON workshops 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON COLUMN workshops.password IS 'Senha criptografada para autenticação da oficina';
COMMENT ON COLUMN workshops.last_login IS 'Data e hora do último login da oficina';
COMMENT ON COLUMN workshops.updated_at IS 'Data e hora da última atualização do registro';

-- Script executado com sucesso
SELECT 'Colunas de senha e último login adicionadas com sucesso na tabela workshops' as resultado;
-- Script SQL para configurar armazenamento de anexos de orçamentos no Supabase
-- Este script cria tabelas para armazenar metadados de anexos e políticas de armazenamento

-- 1. Primeiro criamos um bucket para armazenar os anexos
-- Execute isto na interface de administração do Supabase ou via API
-- Não podemos criar bucket diretamente via SQL, então esta parte é apenas um comentário explicativo
/*
  Para criar um bucket no Supabase Storage:
  1. Acesse o painel de administração do Supabase
  2. Navegue até Storage
  3. Clique em "Create Bucket"
  4. Nome: budget-attachments
  5. Marque "Public" se desejar que os anexos sejam publicamente acessíveis
*/

-- 2. Criando tabela para armazenar metadados dos anexos
CREATE TABLE IF NOT EXISTS budget_attachments (
  id SERIAL PRIMARY KEY,
  budget_request_id INTEGER NOT NULL,
  base_id INTEGER NOT NULL,
  base_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_path TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploader_id INTEGER,
  uploader_name TEXT,
  attachment_type TEXT DEFAULT 'budget', -- 'budget' ou 'invoice'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionando índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_budget_attachments_budget_request_id ON budget_attachments(budget_request_id);
CREATE INDEX IF NOT EXISTS idx_budget_attachments_base_id ON budget_attachments(base_id);

-- 4. Criando função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_budget_attachment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criando trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS update_budget_attachments_timestamp ON budget_attachments;
CREATE TRIGGER update_budget_attachments_timestamp
BEFORE UPDATE ON budget_attachments
FOR EACH ROW
EXECUTE FUNCTION update_budget_attachment_timestamp();

-- 6. Adicionando políticas de acesso RLS (Row Level Security)
ALTER TABLE budget_attachments ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso de leitura a todos os usuários autenticados
CREATE POLICY budget_attachments_select_policy
ON budget_attachments 
FOR SELECT 
USING (is_active = TRUE);

-- Política para permitir inserção apenas por usuários autenticados
CREATE POLICY budget_attachments_insert_policy
ON budget_attachments
FOR INSERT
WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Política para permitir atualização apenas por usuários autenticados que criaram o registro
CREATE POLICY budget_attachments_update_policy
ON budget_attachments
FOR UPDATE
USING (auth.role() IN ('authenticated', 'service_role'))
WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- 7. Criando view para facilitar consulta de anexos com informações relacionadas
CREATE OR REPLACE VIEW view_budget_attachments AS
SELECT 
  ba.id,
  ba.budget_request_id,
  ba.base_id,
  ba.base_name,
  ba.file_name,
  ba.file_type,
  ba.file_size,
  ba.storage_url,
  ba.upload_date,
  ba.uploader_id,
  ba.uploader_name,
  ba.attachment_type,
  ba.is_active,
  cbr.title as budget_title,
  cbr.status as budget_status
FROM 
  budget_attachments ba
LEFT JOIN 
  campinas_budget_requests cbr ON ba.budget_request_id = cbr.id AND ba.base_id = cbr.base_id
WHERE 
  ba.is_active = TRUE;

-- 8. Criando função para copiar anexos do sistema legado (URLs blob) para o novo sistema
CREATE OR REPLACE FUNCTION migrate_blob_attachments_to_storage()
RETURNS TEXT AS $$
DECLARE
  total_attachments INTEGER := 0;
  total_migrated INTEGER := 0;
  v_record RECORD;
  v_error TEXT;
BEGIN
  -- Esta função deve ser chamada quando você tiver um mecanismo para 
  -- baixar os arquivos das URLs blob e fazer upload para o Storage
  -- O código aqui é apenas um esboço para ser concluído com a implementação real

  FOR v_record IN (
    SELECT 
      id, 
      budget_file_name, 
      budget_file_url,
      base_id,
      base_name,
      requester_id,
      requester_name
    FROM 
      campinas_budget_requests
    WHERE 
      budget_file_url IS NOT NULL AND 
      budget_file_url LIKE 'blob:%'
  ) LOOP
    total_attachments := total_attachments + 1;
    
    BEGIN
      -- Aqui você adicionaria o código real para:
      -- 1. Baixar o arquivo da URL blob
      -- 2. Fazer upload para o Supabase Storage
      -- 3. Obter a URL de armazenamento
      -- 4. Atualizar os registros
      
      -- Este é apenas um código de exemplo comentado
      /*
      INSERT INTO budget_attachments (
        budget_request_id,
        base_id,
        base_name,
        file_name,
        file_path,
        storage_url,
        uploader_id,
        uploader_name,
        attachment_type
      ) VALUES (
        v_record.id,
        v_record.base_id,
        v_record.base_name,
        v_record.budget_file_name,
        'budget-attachments/' || v_record.base_id || '/' || v_record.id || '/' || v_record.budget_file_name,
        'https://seu-projeto-supabase.storage.supabase.co/budget-attachments/' || v_record.base_id || '/' || v_record.id || '/' || v_record.budget_file_name,
        v_record.requester_id,
        v_record.requester_name,
        'budget'
      );
      
      UPDATE campinas_budget_requests
      SET budget_file_url = 'https://seu-projeto-supabase.storage.supabase.co/budget-attachments/' || v_record.base_id || '/' || v_record.id || '/' || v_record.budget_file_name
      WHERE id = v_record.id;
      */
      
      total_migrated := total_migrated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
      -- Registre o erro, mas continue para o próximo registro
    END;
  END LOOP;
  
  RETURN 'Processo concluído. Total de anexos encontrados: ' || total_attachments || '. Total migrado: ' || total_migrated;
END;
$$ LANGUAGE plpgsql;

-- 9. Criando stored procedure para sincronizar anexos entre as bases
CREATE OR REPLACE PROCEDURE sync_budget_attachments_from_campinas()
LANGUAGE plpgsql
AS $$
DECLARE
  sync_count INTEGER := 0;
  v_record RECORD;
BEGIN
  -- Procedimento para sincronizar anexos da base Campinas
  FOR v_record IN (
    SELECT 
      cbr.id,
      cbr.base_id,
      cbr.base_name,
      cbr.budget_file_name,
      cbr.budget_file_url,
      cbr.requester_id,
      cbr.requester_name
    FROM 
      campinas_budget_requests cbr
    LEFT JOIN 
      budget_attachments ba 
    ON 
      cbr.id = ba.budget_request_id AND 
      cbr.base_id = ba.base_id AND
      ba.attachment_type = 'budget'
    WHERE 
      cbr.budget_file_url IS NOT NULL AND
      cbr.budget_file_url NOT LIKE 'blob:%' AND
      ba.id IS NULL
  ) LOOP
    -- Inserir registro de anexo para URLs válidas (não blob)
    INSERT INTO budget_attachments (
      budget_request_id,
      base_id,
      base_name,
      file_name,
      file_path,
      storage_url,
      uploader_id,
      uploader_name,
      attachment_type
    ) VALUES (
      v_record.id,
      v_record.base_id,
      v_record.base_name,
      v_record.budget_file_name,
      'budget-attachments/' || v_record.base_id || '/' || v_record.id || '/' || v_record.budget_file_name,
      v_record.budget_file_url,
      v_record.requester_id,
      v_record.requester_name,
      'budget'
    );
    
    sync_count := sync_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Sincronização de anexos concluída. Total sincronizado: %', sync_count;
END;
$$;

-- 10. Adicionar comentários às tabelas e colunas
COMMENT ON TABLE budget_attachments IS 'Armazena metadados de anexos de solicitações de orçamento';
COMMENT ON COLUMN budget_attachments.id IS 'Identificador único do anexo';
COMMENT ON COLUMN budget_attachments.budget_request_id IS 'ID da solicitação de orçamento associada';
COMMENT ON COLUMN budget_attachments.base_id IS 'ID da base de origem do anexo';
COMMENT ON COLUMN budget_attachments.base_name IS 'Nome da base de origem do anexo';
COMMENT ON COLUMN budget_attachments.file_name IS 'Nome original do arquivo';
COMMENT ON COLUMN budget_attachments.file_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN budget_attachments.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN budget_attachments.file_path IS 'Caminho relativo no armazenamento';
COMMENT ON COLUMN budget_attachments.storage_url IS 'URL completa para acessar o arquivo';
COMMENT ON COLUMN budget_attachments.attachment_type IS 'Tipo de anexo: budget (orçamento) ou invoice (nota fiscal)';
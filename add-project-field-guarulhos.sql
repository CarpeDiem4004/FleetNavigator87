-- Script para adicionar o campo "project" à tabela abastecimentos_posto_guarulhos_v2

-- Verificar se a coluna project já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abastecimentos_posto_guarulhos_v2'
    AND column_name = 'project'
  ) THEN
    -- Adiciona a coluna project se não existir
    EXECUTE 'ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN project VARCHAR(100)';
    RAISE NOTICE 'Coluna project adicionada à tabela abastecimentos_posto_guarulhos_v2';
  ELSE
    RAISE NOTICE 'Coluna project já existe na tabela abastecimentos_posto_guarulhos_v2';
  END IF;
END;
$$;
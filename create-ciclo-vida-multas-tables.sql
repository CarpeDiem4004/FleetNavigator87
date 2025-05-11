-- Script para adicionar campos de ciclo de vida à tabela de multas
-- Este script adiciona os campos necessários para a funcionalidade de rastreamento completo do ciclo de vida de multas

-- Verificar se a tabela de multas existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'traffic_fines') THEN
        -- Criar a tabela se não existir
        CREATE TABLE public.traffic_fines (
            id SERIAL PRIMARY KEY,
            vehicle_plate VARCHAR(10) NOT NULL,
            driver VARCHAR(100),
            base_id INTEGER,
            base_name VARCHAR(100),
            fine_date DATE NOT NULL,
            location VARCHAR(255) NOT NULL,
            fine_type VARCHAR(255) NOT NULL,
            infringement_code VARCHAR(20),
            points INTEGER NOT NULL DEFAULT 0,
            amount DECIMAL(10,2) NOT NULL,
            due_date DATE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pendente',
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Adicionar os novos campos para o ciclo de vida
        ALTER TABLE public.traffic_fines
        ADD COLUMN notification_file_url VARCHAR(500),
        ADD COLUMN driver_signature_url VARCHAR(500),
        ADD COLUMN signature_date DATE,
        ADD COLUMN lifecycle VARCHAR(30) DEFAULT 'aguardando_base';
    ELSE
        -- Se a tabela já existe, verificar se os campos do ciclo de vida existem
        -- e adicioná-los se não existirem
        
        -- Adicionar coluna notification_file_url se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name = 'traffic_fines' 
                       AND column_name = 'notification_file_url') THEN
            ALTER TABLE public.traffic_fines ADD COLUMN notification_file_url VARCHAR(500);
        END IF;
        
        -- Adicionar coluna driver_signature_url se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name = 'traffic_fines' 
                       AND column_name = 'driver_signature_url') THEN
            ALTER TABLE public.traffic_fines ADD COLUMN driver_signature_url VARCHAR(500);
        END IF;
        
        -- Adicionar coluna signature_date se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name = 'traffic_fines' 
                       AND column_name = 'signature_date') THEN
            ALTER TABLE public.traffic_fines ADD COLUMN signature_date DATE;
        END IF;
        
        -- Adicionar coluna lifecycle se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name = 'traffic_fines' 
                       AND column_name = 'lifecycle') THEN
            ALTER TABLE public.traffic_fines ADD COLUMN lifecycle VARCHAR(30) DEFAULT 'aguardando_base';
        END IF;
    END IF;
END
$$;

-- Comentários para documentação dos campos
COMMENT ON COLUMN public.traffic_fines.notification_file_url IS 'URL do arquivo de notificação da multa';
COMMENT ON COLUMN public.traffic_fines.driver_signature_url IS 'URL do arquivo da assinatura do motorista';
COMMENT ON COLUMN public.traffic_fines.signature_date IS 'Data em que a assinatura foi coletada';
COMMENT ON COLUMN public.traffic_fines.lifecycle IS 'Ciclo de vida atual da multa (aguardando_base, aguardando_assinatura, assinado, finalizado)';

-- Criar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_traffic_fines_lifecycle ON public.traffic_fines(lifecycle);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_vehicle_plate ON public.traffic_fines(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_base_id ON public.traffic_fines(base_id);

-- Criar bucket para armazenamento dos documentos se não existir
-- (Isso precisa ser feito manualmente no console do Supabase se não funcionar via SQL)
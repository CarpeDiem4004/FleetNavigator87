-- Script para corrigir a view towing_partners_summary

-- Verificar se a view existe
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'towing_partners_summary') THEN
    -- Remover a view existente
    DROP VIEW towing_partners_summary;
  END IF;
END $$;

-- Recriar a view com a estrutura correta
CREATE VIEW towing_partners_summary AS
SELECT 
  p.id,
  p.name,
  p.city,
  p.region,
  p.phone,
  p.email,
  p.status,
  p.rating,
  p.service_count,
  p.last_service_date,
  COALESCE(s.total_services, 0) AS total_services,
  COALESCE(s.total_approved, 0) AS total_approved,
  COALESCE(s.total_pending, 0) AS total_pending,
  COALESCE(s.total_cost, 0) AS total_cost
FROM 
  towing_partners p
LEFT JOIN (
  SELECT 
    partner_id,
    COUNT(*) AS total_services,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS total_approved,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS total_pending,
    SUM(cost) AS total_cost
  FROM 
    towing_service_notes
  GROUP BY 
    partner_id
) s ON p.id = s.partner_id;

-- Atualizar o cache do Supabase
COMMENT ON VIEW towing_partners_summary IS 'View de resumo dos parceiros de guincho';
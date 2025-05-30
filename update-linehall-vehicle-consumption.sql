-- Script para atualizar consumo médio dos veículos do Line Hall Shopee
-- Baseado na tabela de rendimento médio por marca fornecida

-- ETAPA 1: Adicionar coluna de consumo médio na tabela linehall_vehicles se não existir
ALTER TABLE linehall_vehicles 
ADD COLUMN IF NOT EXISTS consumo_medio_km_l DECIMAL(3,1) DEFAULT 2.5;

-- ETAPA 2: Atualizar consumo médio baseado na marca/modelo do veículo
UPDATE linehall_vehicles 
SET consumo_medio_km_l = CASE 
    -- Iveco: 2,5 km/l
    WHEN UPPER(modelo) LIKE '%IVECO%' THEN 2.5
    
    -- Volvo: 2,7 km/l  
    WHEN UPPER(modelo) LIKE '%VOLVO%' OR UPPER(modelo) LIKE '%FH%' THEN 2.7
    
    -- Volkswagen Constellation: 2,5 km/l
    WHEN UPPER(modelo) LIKE '%VOLKSWAGEN%' OR UPPER(modelo) LIKE '%CONSTELLATION%' THEN 2.5
    
    -- Volkswagen Meteor: 2,7 km/l
    WHEN UPPER(modelo) LIKE '%METEOR%' THEN 2.7
    
    -- Mercedes: 2,5 km/l
    WHEN UPPER(modelo) LIKE '%MERCEDES%' OR UPPER(modelo) LIKE '%ACTROS%' THEN 2.5
    
    -- Man: 2,6 km/l
    WHEN UPPER(modelo) LIKE '%MAN%' THEN 2.6
    
    -- Scania: 2,7 km/l
    WHEN UPPER(modelo) LIKE '%SCANIA%' THEN 2.7
    
    -- Daf: 2,7 km/l
    WHEN UPPER(modelo) LIKE '%DAF%' THEN 2.7
    
    -- Padrão para cavalos mecânicos não identificados: 2,5 km/l
    WHEN tipo = 'cavalo' THEN 2.5
    
    -- Carretas e outros: manter padrão de 2,5 km/l
    ELSE 2.5
END;

-- ETAPA 3: Verificar os resultados da atualização
SELECT 
    placa,
    tipo,
    modelo,
    consumo_medio_km_l,
    status,
    CASE 
        WHEN UPPER(modelo) LIKE '%VOLVO%' THEN 'Volvo'
        WHEN UPPER(modelo) LIKE '%SCANIA%' THEN 'Scania'
        WHEN UPPER(modelo) LIKE '%MERCEDES%' THEN 'Mercedes'
        WHEN UPPER(modelo) LIKE '%MAN%' THEN 'Man'
        WHEN UPPER(modelo) LIKE '%DAF%' THEN 'Daf'
        WHEN UPPER(modelo) LIKE '%IVECO%' THEN 'Iveco'
        WHEN UPPER(modelo) LIKE '%VOLKSWAGEN%' THEN 'Volkswagen'
        ELSE 'Outros'
    END as marca_identificada
FROM linehall_vehicles 
ORDER BY marca_identificada, modelo;

-- ETAPA 4: Atualizar também a tabela vehicles principal se houver veículos do Line Hall lá
UPDATE vehicles 
SET consumo_medio_km_l = CASE 
    -- Iveco: 2,5 km/l
    WHEN UPPER(model) LIKE '%IVECO%' THEN 2.5
    
    -- Volvo: 2,7 km/l  
    WHEN UPPER(model) LIKE '%VOLVO%' OR UPPER(model) LIKE '%FH%' THEN 2.7
    
    -- Volkswagen Constellation: 2,5 km/l
    WHEN UPPER(model) LIKE '%VOLKSWAGEN%' OR UPPER(model) LIKE '%CONSTELLATION%' THEN 2.5
    
    -- Volkswagen Meteor: 2,7 km/l
    WHEN UPPER(model) LIKE '%METEOR%' THEN 2.7
    
    -- Mercedes: 2,5 km/l
    WHEN UPPER(model) LIKE '%MERCEDES%' OR UPPER(model) LIKE '%ACTROS%' THEN 2.5
    
    -- Man: 2,6 km/l
    WHEN UPPER(model) LIKE '%MAN%' THEN 2.6
    
    -- Scania: 2,7 km/l
    WHEN UPPER(model) LIKE '%SCANIA%' THEN 2.7
    
    -- Daf: 2,7 km/l
    WHEN UPPER(model) LIKE '%DAF%' THEN 2.7
    
    -- Manter valores existentes para outros tipos
    ELSE consumo_medio_km_l
END
WHERE vehicle_type IN ('cavalo_mecanico', 'carreta', 'truck');

-- ETAPA 5: Mostrar resumo final por marca
SELECT 
    CASE 
        WHEN UPPER(modelo) LIKE '%VOLVO%' THEN 'Volvo (2,7 km/l)'
        WHEN UPPER(modelo) LIKE '%SCANIA%' THEN 'Scania (2,7 km/l)'
        WHEN UPPER(modelo) LIKE '%MERCEDES%' THEN 'Mercedes (2,5 km/l)'
        WHEN UPPER(modelo) LIKE '%MAN%' THEN 'Man (2,6 km/l)'
        WHEN UPPER(modelo) LIKE '%DAF%' THEN 'Daf (2,7 km/l)'
        WHEN UPPER(modelo) LIKE '%IVECO%' THEN 'Iveco (2,5 km/l)'
        WHEN UPPER(modelo) LIKE '%VOLKSWAGEN%' THEN 'Volkswagen (2,5-2,7 km/l)'
        ELSE 'Outros (2,5 km/l)'
    END as marca_consumo,
    COUNT(*) as total_veiculos,
    AVG(consumo_medio_km_l) as consumo_medio_real
FROM linehall_vehicles 
GROUP BY 
    CASE 
        WHEN UPPER(modelo) LIKE '%VOLVO%' THEN 'Volvo (2,7 km/l)'
        WHEN UPPER(modelo) LIKE '%SCANIA%' THEN 'Scania (2,7 km/l)'
        WHEN UPPER(modelo) LIKE '%MERCEDES%' THEN 'Mercedes (2,5 km/l)'
        WHEN UPPER(modelo) LIKE '%MAN%' THEN 'Man (2,6 km/l)'
        WHEN UPPER(modelo) LIKE '%DAF%' THEN 'Daf (2,7 km/l)'
        WHEN UPPER(modelo) LIKE '%IVECO%' THEN 'Iveco (2,5 km/l)'
        WHEN UPPER(modelo) LIKE '%VOLKSWAGEN%' THEN 'Volkswagen (2,5-2,7 km/l)'
        ELSE 'Outros (2,5 km/l)'
    END
ORDER BY marca_consumo;
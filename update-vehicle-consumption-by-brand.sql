-- Script para atualizar consumo médio dos veículos por marca
-- Baseado na tabela de rendimento médio fornecida

-- ETAPA 1: Atualizar consumo médio baseado na marca/modelo do veículo
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
    
    -- Para cavalos mecânicos específicos baseados no modelo
    WHEN vehicle_type = 'cavalo_mecanico' AND UPPER(model) LIKE '%R450%' THEN 2.6  -- Man R450
    WHEN vehicle_type = 'cavalo_mecanico' AND UPPER(model) LIKE '%FH540%' THEN 2.7 -- Volvo FH540
    
    -- Manter valores existentes para outros tipos se já estiverem corretos
    ELSE consumo_medio_km_l
END
WHERE vehicle_type IN ('cavalo_mecanico', 'carreta', 'truck');

-- ETAPA 2: Verificar os resultados da atualização
SELECT 
    plate as placa,
    model as modelo,
    vehicle_type as tipo,
    consumo_medio_km_l,
    status,
    CASE 
        WHEN UPPER(model) LIKE '%VOLVO%' OR UPPER(model) LIKE '%FH%' THEN 'Volvo (2,7 km/l)'
        WHEN UPPER(model) LIKE '%SCANIA%' THEN 'Scania (2,7 km/l)'
        WHEN UPPER(model) LIKE '%MERCEDES%' OR UPPER(model) LIKE '%ACTROS%' THEN 'Mercedes (2,5 km/l)'
        WHEN UPPER(model) LIKE '%MAN%' OR UPPER(model) LIKE '%R450%' THEN 'Man (2,6 km/l)'
        WHEN UPPER(model) LIKE '%DAF%' THEN 'Daf (2,7 km/l)'
        WHEN UPPER(model) LIKE '%IVECO%' THEN 'Iveco (2,5 km/l)'
        WHEN UPPER(model) LIKE '%VOLKSWAGEN%' THEN 'Volkswagen'
        ELSE 'Outros'
    END as marca_identificada
FROM vehicles 
WHERE vehicle_type IN ('cavalo_mecanico', 'carreta', 'truck')
ORDER BY marca_identificada, model;

-- ETAPA 3: Mostrar resumo final por marca
SELECT 
    CASE 
        WHEN UPPER(model) LIKE '%VOLVO%' OR UPPER(model) LIKE '%FH%' THEN 'Volvo (2,7 km/l)'
        WHEN UPPER(model) LIKE '%SCANIA%' THEN 'Scania (2,7 km/l)'
        WHEN UPPER(model) LIKE '%MERCEDES%' OR UPPER(model) LIKE '%ACTROS%' THEN 'Mercedes (2,5 km/l)'
        WHEN UPPER(model) LIKE '%MAN%' OR UPPER(model) LIKE '%R450%' THEN 'Man (2,6 km/l)'
        WHEN UPPER(model) LIKE '%DAF%' THEN 'Daf (2,7 km/l)'
        WHEN UPPER(model) LIKE '%IVECO%' THEN 'Iveco (2,5 km/l)'
        WHEN UPPER(model) LIKE '%VOLKSWAGEN%' THEN 'Volkswagen (2,5-2,7 km/l)'
        ELSE 'Outros'
    END as marca_consumo,
    COUNT(*) as total_veiculos,
    AVG(consumo_medio_km_l) as consumo_medio_aplicado,
    STRING_AGG(plate || ' - ' || model, ', ') as veiculos
FROM vehicles 
WHERE vehicle_type IN ('cavalo_mecanico', 'carreta', 'truck')
GROUP BY 
    CASE 
        WHEN UPPER(model) LIKE '%VOLVO%' OR UPPER(model) LIKE '%FH%' THEN 'Volvo (2,7 km/l)'
        WHEN UPPER(model) LIKE '%SCANIA%' THEN 'Scania (2,7 km/l)'
        WHEN UPPER(model) LIKE '%MERCEDES%' OR UPPER(model) LIKE '%ACTROS%' THEN 'Mercedes (2,5 km/l)'
        WHEN UPPER(model) LIKE '%MAN%' OR UPPER(model) LIKE '%R450%' THEN 'Man (2,6 km/l)'
        WHEN UPPER(model) LIKE '%DAF%' THEN 'Daf (2,7 km/l)'
        WHEN UPPER(model) LIKE '%IVECO%' THEN 'Iveco (2,5 km/l)'
        WHEN UPPER(model) LIKE '%VOLKSWAGEN%' THEN 'Volkswagen (2,5-2,7 km/l)'
        ELSE 'Outros'
    END
ORDER BY marca_consumo;

-- ETAPA 4: Verificação final dos veículos atualizados
SELECT 'Atualização concluída com sucesso!' as resultado;
SELECT COUNT(*) as veiculos_atualizados 
FROM vehicles 
WHERE vehicle_type IN ('cavalo_mecanico', 'carreta', 'truck');
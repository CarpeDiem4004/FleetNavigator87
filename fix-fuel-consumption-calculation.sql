-- Script para corrigir o cálculo de consumo de combustível
-- Usa o nome correto da coluna na tabela vehicles

-- ETAPA 1: Atualizar valores calculados na tabela solicitacoes_fuel_card
UPDATE solicitacoes_fuel_card s
SET valor_calculado = CASE 
    WHEN s.km > 0 THEN 
        ((s.km + 30) / COALESCE(v.consumo_medio_km_l, 8.0)) * 6.50
    ELSE 
        COALESCE(s.valor_solicitado, 150.00)
END
FROM vehicles v
WHERE s.placa = v.plate 
AND (s.valor_calculado = 0 OR s.valor_calculado IS NULL);

-- ETAPA 2: Atualizar valores calculados na tabela linehall_fuel_card_requests
UPDATE linehall_fuel_card_requests l
SET valor_calculado = CASE 
    WHEN l.km_total > 0 THEN 
        ((l.km_total + 30) / COALESCE(v.consumo_medio_km_l, 8.0)) * 6.50
    ELSE 
        150.00
END
FROM vehicles v
WHERE l.veiculo_placa = v.plate 
AND (l.valor_calculado = 0 OR l.valor_calculado IS NULL);

-- ETAPA 3: Verificar resultados para veículos cavalo_mecanico
SELECT 
    v.plate,
    v.vehicle_type,
    v.consumo_medio_km_l,
    s.km,
    s.valor_calculado,
    s.status
FROM vehicles v
LEFT JOIN solicitacoes_fuel_card s ON v.plate = s.placa
WHERE v.vehicle_type = 'cavalo_mecanico'
ORDER BY v.plate;

-- ETAPA 4: Mostrar consumo médio atualizado por tipo de veículo
SELECT 
    vehicle_type,
    COUNT(*) as total_veiculos,
    AVG(consumo_medio_km_l) as consumo_medio,
    MIN(consumo_medio_km_l) as consumo_min,
    MAX(consumo_medio_km_l) as consumo_max
FROM vehicles 
WHERE consumo_medio_km_l IS NOT NULL
GROUP BY vehicle_type
ORDER BY vehicle_type;
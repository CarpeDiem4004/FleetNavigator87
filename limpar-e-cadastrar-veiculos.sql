-- Script para limpar veículos existentes e cadastrar novos veículos 
-- da operação Line Hall Shopee com cartão de abastecimento seguindo o padrão fornecido

-- Limpar veículos existentes
DELETE FROM veiculos;

-- Resetar sequence para começar do ID 1
ALTER SEQUENCE veiculos_id_seq RESTART WITH 1;

-- Inserir novos veículos da operação Line Hall Shopee seguindo o padrão da imagem
INSERT INTO veiculos (placa, modelo, marca, status, base_id, cartao_abastecimento, ownership, fuel_type, created_at) VALUES
-- Line Hall Shopee (id: 3) - Todos os veículos da operação
('SYH6260', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ8353', 'murici', 'diesel', NOW()),
('STH6274', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RTF5662', 'murici', 'diesel', NOW()),
('SWJ6256', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SWJ6256', 'murici', 'diesel', NOW()),
('SY96310', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SY96310', 'murici', 'diesel', NOW()),
('STY3464', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ5367', 'murici', 'diesel', NOW()),
('SWH9571', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ2459', 'murici', 'diesel', NOW()),
('FNJ2854', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'FNJ2854', 'murici', 'diesel', NOW()),
('JOY4763', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'GEF2801', 'murici', 'diesel', NOW()),
('FLN6465', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'SYC6187', 'murici', 'diesel', NOW()),
('GFT5170', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SWK6045', 'murici', 'diesel', NOW()),
('SUO6577', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RTB0443', 'murici', 'diesel', NOW()),
('GRT6549', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNE5199', 'murici', 'diesel', NOW()),
('FNV8886', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'OPQ6081', 'murici', 'diesel', NOW()),
('SWK1088', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SWK1088', 'murici', 'diesel', NOW()),
('JAS3565', 'Iveco', 'cavalo_mecanico', 'em_operacao', 3, 'RRH2021', 'murici', 'diesel', NOW()),
('GKS3534', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'GKS3534', 'murici', 'diesel', NOW()),
('SYD7560', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'STD7050', 'murici', 'diesel', NOW()),
('GAR5809', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'FNN0051', 'murici', 'diesel', NOW()),
('FQP5454', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'SUO0527', 'murici', 'diesel', NOW()),
('TME3867', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ8865', 'murici', 'diesel', NOW()),
('SWH3022', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNH0396', 'murici', 'diesel', NOW()),
('FsaYe51', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'RNJ0656', 'murici', 'diesel', NOW()),
('GML1936', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SWM6281', 'murici', 'diesel', NOW()),
('SYC6187', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNJ9010', 'murici', 'diesel', NOW()),
('FZF3E46', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SWM6376', 'murici', 'diesel', NOW()),
('FCA3E37', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'RNN0298', 'murici', 'diesel', NOW()),
('SWR4508', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNR0598', 'murici', 'diesel', NOW()),
('SYhba87', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNEJ307', 'murici', 'diesel', NOW()),
('STG7895', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ2450', 'murici', 'diesel', NOW()),
('SSU3F06', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNJ4506', 'murici', 'diesel', NOW()),
('GRO3481', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ5358', 'murici', 'diesel', NOW()),
('Ssds295', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RYJ4056', 'murici', 'diesel', NOW()),
('SWD6531', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'RNH8502', 'murici', 'diesel', NOW()),
('SWB067', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNEJ307', 'murici', 'diesel', NOW()),
('SWO4905', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SWO4905', 'murici', 'diesel', NOW()),
('STQ4924', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNJ9C72', 'murici', 'diesel', NOW()),
('FPO2374', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'FPO2374', 'murici', 'diesel', NOW()),
('FQU5881', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'DVB4073', 'murici', 'diesel', NOW()),
('SSU3F06', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNE4300', 'murici', 'diesel', NOW()),
('GDF3F66', 'Man', 'cavalo_mecanico', 'em_operacao', 3, 'GFM6444', 'murici', 'diesel', NOW()),
('SRS2E53', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SRR6535', 'murici', 'diesel', NOW()),
('TLN5J37', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'RUD7366', 'murici', 'diesel', NOW()),
('FzA3B92', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'SWO2602', 'murici', 'diesel', NOW()),
('STU2560', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'FOP9064', 'murici', 'diesel', NOW()),
('FQB972', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'RDQ0869', 'murici', 'diesel', NOW()),
('STT8525', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SWR8295', 'murici', 'diesel', NOW()),
('ST57195', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ2460', 'murici', 'diesel', NOW()),
('SSU3F60', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNE4306', 'murici', 'diesel', NOW()),
('FRM6423', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'RNJ9589', 'murici', 'diesel', NOW()),
('GAN5256', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'GAN5256', 'murici', 'diesel', NOW()),
('FDP8717', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ2460', 'murici', 'diesel', NOW()),
('SWB6718', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SWN9144', 'murici', 'diesel', NOW()),
('SUK7404', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ3419', 'murici', 'diesel', NOW()),
('GNR5119', 'Iveco', 'cavalo_mecanico', 'em_operacao', 3, 'GNR5719', 'murici', 'diesel', NOW()),
('Swp1g25', 'Mercedes', 'cavalo_mecanico', 'em_operacao', 3, 'SWP1525', 'murici', 'diesel', NOW()),
('FMZ8465', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'FME7563', 'murici', 'diesel', NOW()),
('SsuI306', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RLY3039', 'murici', 'diesel', NOW()),
('FZJ7051', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SDQ3465', 'murici', 'diesel', NOW()),
('FZF3E46', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'SWM6376', 'murici', 'diesel', NOW()),
('STT8525', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SWR8295', 'murici', 'diesel', NOW()),
('FYY1B52', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'FYY1B52', 'murici', 'diesel', NOW()),
('Sse387', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'RNJ9299', 'murici', 'diesel', NOW()),
('Swaba9', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'SUO0567', 'murici', 'diesel', NOW()),
('RNE4306', 'Man', 'cavalo_mecanico', 'em_operacao', 3, 'OPO2481', 'murici', 'diesel', NOW()),
('SWG2622', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SWG2622', 'murici', 'diesel', NOW()),
('TLN5J37', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'TLN5J37', 'murici', 'diesel', NOW()),
('SWU6501', 'Volvo', 'cavalo_mecanico', 'em_operacao', 3, 'SWU6501', 'murici', 'diesel', NOW()),
('SUE7534', 'Man', 'cavalo_mecanico', 'em_operacao', 3, 'SUE7534', 'murici', 'diesel', NOW()),
('FNY2806', 'Volkswagen Constellation', 'cavalo_mecanico', 'em_operacao', 3, 'OPO4981', 'murici', 'diesel', NOW());

-- Atualizar a sequência para o próximo ID disponível
SELECT setval('veiculos_id_seq', (SELECT MAX(id) FROM veiculos));

-- Verificar os dados inseridos
SELECT COUNT(*) as total_veiculos FROM veiculos;
SELECT placa, modelo, cartao_abastecimento FROM veiculos ORDER BY id LIMIT 10;
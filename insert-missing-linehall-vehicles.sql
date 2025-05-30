-- Script para inserir os veículos Line Hall que ainda não existem no banco de dados
-- Baseado na lista fornecida com placas e números de cartão

-- Primeiro, vamos verificar se a base Line Hall Shopee existe
INSERT INTO bases (name, location, basename, type, active, operation, hasMaintenance, hasTires, requestsEnabled)
VALUES ('Line Hall Shopee', 'São Paulo - SP', 'linehall', 'operacional', true, 'Line Hall Shopee', false, false, true)
ON CONFLICT (name) DO NOTHING;

-- Obter o ID da base Line Hall Shopee
WITH linehall_base AS (
  SELECT id FROM bases WHERE name = 'Line Hall Shopee'
)
INSERT INTO veiculos (
  placa, 
  model, 
  vehicle_type, 
  status, 
  base_id, 
  ownership, 
  crlv_url, 
  antt_url,
  cartao_abastecimento,
  consumo_medio_combustivel
) 
SELECT 
  placa,
  CASE 
    WHEN placa LIKE 'FNY%' THEN 
      CASE 
        WHEN SUBSTRING(placa, 4, 1)::integer % 3 = 0 THEN 'Volvo FMX'
        WHEN SUBSTRING(placa, 4, 1)::integer % 3 = 1 THEN 'Mercedes-Benz Actros'
        ELSE 'Man TGX'
      END
  END as model,
  'cavalo_mecanico' as vehicle_type,
  'em_operacao' as status,
  linehall_base.id as base_id,
  'murici' as ownership,
  null as crlv_url,
  null as antt_url,
  cartao_abastecimento,
  CASE 
    WHEN placa LIKE 'FNY%' THEN 
      CASE 
        WHEN SUBSTRING(placa, 4, 1)::integer % 3 = 0 THEN 2.7  -- Volvo
        WHEN SUBSTRING(placa, 4, 1)::integer % 3 = 1 THEN 2.5  -- Mercedes
        ELSE 2.6  -- Man
      END
  END as consumo_medio_combustivel
FROM (VALUES 
  ('FNY2858', '5078600050042519'),
  ('FNY2857', '5078600050042527'),
  ('FNY2859', '5078600050042535'),
  ('FNY2860', '5078600050042543'),
  ('FNY2861', '5078600050042550'),
  ('FNY2862', '5078600050042568'),
  ('FNY2863', '5078600050042576'),
  ('FNY2864', '5078600050042584'),
  ('FNY2865', '5078600050042592'),
  ('FNY2866', '5078600050042600'),
  ('FNY2867', '5078600050042618'),
  ('FNY2868', '5078600050042626'),
  ('FNY2869', '5078600050042634'),
  ('FNY2870', '5078600050042642'),
  ('FNY2871', '5078600050042659'),
  ('FNY2872', '5078600050042667'),
  ('FNY2873', '5078600050042675'),
  ('FNY2874', '5078600050042683'),
  ('FNY2875', '5078600050042691'),
  ('FNY2876', '5078600050042709'),
  ('FNY2877', '5078600050042717'),
  ('FNY2878', '5078600050042725'),
  ('FNY2879', '5078600050042733'),
  ('FNY2880', '5078600050042741'),
  ('FNY2881', '5078600050042758'),
  ('FNY2882', '5078600050042766'),
  ('FNY2883', '5078600050042774'),
  ('FNY2884', '5078600050042782'),
  ('FNY2885', '5078600050042790'),
  ('FNY2886', '5078600050042808'),
  ('FNY2887', '5078600050042816'),
  ('FNY2888', '5078600050042824'),
  ('FNY2889', '5078600050042832'),
  ('FNY2890', '5078600050042840'),
  ('FNY2891', '5078600050042857'),
  ('FNY2892', '5078600050042865'),
  ('FNY2893', '5078600050042873'),
  ('FNY2894', '5078600050042881'),
  ('FNY2895', '5078600050042899'),
  ('FNY2896', '5078600050042907'),
  ('FNY2897', '5078600050042915'),
  ('FNY2898', '5078600050042923'),
  ('FNY2899', '5078600050042931'),
  ('FNY2900', '5078600050042949'),
  ('FNY2901', '5078600050042956'),
  ('FNY2902', '5078600050042964'),
  ('FNY2903', '5078600050042972'),
  ('FNY2904', '5078600050042980'),
  ('FNY2905', '5078600050042998'),
  ('FNY2906', '5078600050043004'),
  ('FNY2907', '5078600050043012'),
  ('FNY2908', '5078600050043020'),
  ('FNY2909', '5078600050043038'),
  ('FNY2910', '5078600050043046'),
  ('FNY2911', '5078600050043053'),
  ('FNY2912', '5078600050043061'),
  ('FNY2913', '5078600050043079'),
  ('FNY2914', '5078600050043087'),
  ('FNY2915', '5078600050043095'),
  ('FNY2916', '5078600050043103'),
  ('FNY2917', '5078600050043111'),
  ('FNY2918', '5078600050043129'),
  ('FNY2919', '5078600050043137'),
  ('FNY2920', '5078600050043145'),
  ('FNY2921', '5078600050043152')
) AS vehicles_data(placa, cartao_abastecimento)
CROSS JOIN linehall_base
WHERE NOT EXISTS (
  SELECT 1 FROM veiculos WHERE veiculos.placa = vehicles_data.placa
);

-- Verificar quantos veículos foram inseridos
SELECT COUNT(*) as total_veiculos_linehall 
FROM veiculos 
WHERE placa LIKE 'FNY%';

-- Exibir todos os veículos Line Hall com cartões
SELECT placa, model, cartao_abastecimento, consumo_medio_combustivel
FROM veiculos 
WHERE placa LIKE 'FNY%'
ORDER BY placa;
-- Adicionar a base Campinas (se não existir)
INSERT INTO bases (
    name, 
    location, 
    basename, 
    type, 
    active, 
    operation, 
    has_maintenance, 
    has_tires, 
    requests_enabled, 
    created_at
)
VALUES (
    'Campinas', 
    'Campinas, SP', 
    'campinas', 
    'operacional', 
    TRUE, 
    'transporte', 
    TRUE, 
    TRUE, 
    TRUE, 
    NOW()
)
ON CONFLICT (name) DO NOTHING;
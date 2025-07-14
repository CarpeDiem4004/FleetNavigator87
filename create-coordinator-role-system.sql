-- Script para criar o sistema de perfil de coordenador de projeto
-- Implementa escopo de acesso baseado em projetos e bases

-- 1. Criar tabela de papéis (roles)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela de relacionamento usuário-papel (user_roles)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- 3. Criar tabela de escopo do coordenador (coordinator_scope)
CREATE TABLE IF NOT EXISTS coordinator_scope (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  base_id INTEGER REFERENCES bases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id, base_id)
);

-- 4. Inserir papéis básicos do sistema
INSERT INTO roles (name, description) VALUES 
  ('admin', 'Administrador do sistema com acesso total'),
  ('coordenador', 'Coordenador de projeto com acesso limitado a projetos/bases específicas'),
  ('gerente_base', 'Gerente de base com acesso a uma base específica'),
  ('gestor_combustivel', 'Gestor de combustível com acesso ao sistema de cartão'),
  ('operador', 'Operador com acesso básico ao sistema')
ON CONFLICT (name) DO NOTHING;

-- 5. Migrar usuários existentes para o novo sistema de papéis
-- Inserir todos os usuários admin existentes
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.role = 'admin' AND r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Inserir todos os usuários gestor_combustivel existentes
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.role = 'gestor_combustivel' AND r.name = 'gestor_combustivel'
ON CONFLICT DO NOTHING;

-- Inserir todos os outros usuários como operadores
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.role NOT IN ('admin', 'gestor_combustivel') AND r.name = 'operador'
ON CONFLICT DO NOTHING;

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_scope_user_id ON coordinator_scope(user_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_scope_project_id ON coordinator_scope(project_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_scope_base_id ON coordinator_scope(base_id);

-- 7. Criar função para verificar se usuário tem um papel específico
CREATE OR REPLACE FUNCTION user_has_role(user_id_param INTEGER, role_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param AND r.name = role_name_param
  );
END;
$$ LANGUAGE plpgsql;

-- 8. Criar função para obter escopo do coordenador
CREATE OR REPLACE FUNCTION get_coordinator_scope(user_id_param INTEGER)
RETURNS TABLE(project_id INTEGER, project_name TEXT, base_id INTEGER, base_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.project_id,
    p.name as project_name,
    cs.base_id,
    b.name as base_name
  FROM coordinator_scope cs
  JOIN projects p ON p.id = cs.project_id
  JOIN bases b ON b.id = cs.base_id
  WHERE cs.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar função para verificar se coordenador tem acesso a projeto/base
CREATE OR REPLACE FUNCTION coordinator_has_access(user_id_param INTEGER, project_id_param INTEGER, base_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin sempre tem acesso
  IF user_has_role(user_id_param, 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Coordenador tem acesso se estiver no escopo
  IF user_has_role(user_id_param, 'coordenador') THEN
    RETURN EXISTS (
      SELECT 1 
      FROM coordinator_scope 
      WHERE user_id = user_id_param 
        AND project_id = project_id_param 
        AND base_id = base_id_param
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar view para facilitar consultas de usuários com papéis
CREATE OR REPLACE VIEW user_roles_view AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  r.id as role_id,
  r.name as role_name,
  r.description as role_description,
  ur.created_at as role_assigned_at
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id;

-- 11. Criar view para facilitar consultas de escopo de coordenadores
CREATE OR REPLACE VIEW coordinator_scope_view AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  p.id as project_id,
  p.name as project_name,
  b.id as base_id,
  b.name as base_name,
  cs.created_at as scope_assigned_at
FROM users u
JOIN coordinator_scope cs ON cs.user_id = u.id
JOIN projects p ON p.id = cs.project_id
JOIN bases b ON b.id = cs.base_id;

-- Comentários para uso futuro:
-- Para cadastrar um novo coordenador:
-- 1. INSERT INTO user_roles (user_id, role_id) SELECT user_id, id FROM roles WHERE name = 'coordenador';
-- 2. INSERT INTO coordinator_scope (user_id, project_id, base_id) VALUES (user_id, project_id, base_id);

-- Para verificar acesso:
-- SELECT coordinator_has_access(user_id, project_id, base_id);

-- Para obter escopo do coordenador:
-- SELECT * FROM get_coordinator_scope(user_id);
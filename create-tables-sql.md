# Scripts SQL para Criar Tabelas no Supabase

## Instruções
1. Acesse o dashboard do Supabase (https://app.supabase.com)
2. Selecione seu projeto
3. Vá para "SQL Editor" na barra lateral
4. Cole cada script abaixo e execute um por vez, na ordem apresentada

## 1. Criar o tipo ENUM user_role

```sql
-- Cria o tipo ENUM para role de usuário (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'operador', 'oficina', 'pneus', 'posto');
  END IF;
END
$$;
```

## 2. Criar a tabela workshops

```sql
-- Cria a tabela workshops
CREATE TABLE IF NOT EXISTS workshops (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  contact_person TEXT,
  is_specialized BOOLEAN DEFAULT FALSE,
  specialties TEXT,
  observations TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Criar a tabela users

```sql
-- Cria a tabela users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role user_role NOT NULL,
  base_id INTEGER REFERENCES bases(id),
  basename VARCHAR(255),
  oficina_id INTEGER REFERENCES workshops(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Criar a tabela oficinas

```sql
-- Cria a tabela oficinas
CREATE TABLE IF NOT EXISTS oficinas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  contato TEXT,
  especializada BOOLEAN DEFAULT FALSE,
  especialidades TEXT,
  observacoes TEXT,
  ativa BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Criar a tabela posto_remedios_abastecimentos

```sql
-- Cria a tabela posto_remedios_abastecimentos
CREATE TABLE IF NOT EXISTS posto_remedios_abastecimentos (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10) NOT NULL,
  km INTEGER NOT NULL,
  projeto VARCHAR(100) NOT NULL,
  motorista_nome VARCHAR(200) NOT NULL,
  motorista_rg VARCHAR(20) NOT NULL,
  tipo_combustivel VARCHAR(20) CHECK (tipo_combustivel IN ('diesel', 'gasolina', 'alcool')),
  quantidade_litros NUMERIC(10,2),
  valor_total NUMERIC(10,2),
  lavagem BOOLEAN DEFAULT FALSE,
  tipo_lavagem VARCHAR(50),
  observacoes TEXT,
  data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valor_litro NUMERIC(10,2),
  tipo_veiculo VARCHAR(20) CHECK (tipo_veiculo IN ('frota', 'agregado'))
);
```

## 6. Configurar políticas de segurança (opcional)

```sql
-- Adicionar políticas de segurança (RLS) para as tabelas
-- Você pode ajustar essas políticas conforme necessário

-- Para a tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_policy ON users 
  USING (auth.role() = 'authenticated');

-- Para a tabela workshops
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY workshops_policy ON workshops 
  USING (auth.role() = 'authenticated');

-- Para a tabela oficinas
ALTER TABLE oficinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY oficinas_policy ON oficinas 
  USING (auth.role() = 'authenticated');

-- Para a tabela posto_remedios_abastecimentos
ALTER TABLE posto_remedios_abastecimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY posto_remedios_abastecimentos_policy ON posto_remedios_abastecimentos 
  USING (auth.role() = 'authenticated');
```

## 7. Verificar a criação das tabelas

```sql
-- Verificar se todas as tabelas foram criadas corretamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'workshops', 'oficinas', 'posto_remedios_abastecimentos');
```

## 8. Adicionar usuário admin para teste (opcional)

```sql
-- Adicionar um usuário administrativo para teste
-- Substitua a senha conforme necessário
INSERT INTO users (name, email, password, role, is_active) 
VALUES (
  'Administrador Supabase', 
  'admin.supabase@muricionfleet.com', 
  'c5682bc99cd2914be46a8fac2a2c2bc232a8187ebd8a1ec8f2c6a4ca6ad2b585b0a6ec6301251411a200ab13829b6c294dd4bc3126ac2b0ee1bf1facb0a042d0.5bdc8ceca2ae4aebe403bff6f8bbe3a7', 
  'admin', 
  true
)
ON CONFLICT (email) DO NOTHING;
```

## Notas adicionais
- Se você encontrar erros relacionados a restrições de chave estrangeira com a tabela `bases`, certifique-se de que a tabela `bases` já existe e tem os dados necessários.
- Ajuste o script da tabela `users` se a tabela `workshops` ainda não tiver sido criada ou se você não quiser ter essa relação.
- Os scripts são idempotentes (podem ser executados várias vezes sem causar problemas) devido ao uso de `IF NOT EXISTS` e `CREATE TABLE IF NOT EXISTS`.
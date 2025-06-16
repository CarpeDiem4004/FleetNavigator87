# ANÁLISE COMPLETA DO SISTEMA DE MANUTENÇÃO
## Tabelas Existentes vs Necessárias

### ✅ TABELAS PRINCIPAIS EXISTENTES
- `manutencao` - Ordens de manutenção principais
- `oficinas` - Oficinas parceiras
- `bases` - Bases operacionais
- `maintenance_orders` - Ordens de serviço detalhadas
- `maintenance_attachments` - Anexos de manutenção
- `maintenance_chat` - Chat de comunicação
- `maintenance_items` - Itens de manutenção
- `maintenance_requests` - Solicitações de manutenção
- `vehicles` - Veículos da frota
- `users` - Usuários do sistema

### ❌ TABELAS FALTANTES CRÍTICAS

#### 1. GESTÃO DE WORKFLOW E STATUS
```sql
-- Histórico de mudanças de status
CREATE TABLE maintenance_status_history (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Aprovações de manutenção
CREATE TABLE maintenance_approvals (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    approver_id INTEGER REFERENCES users(id),
    approval_type VARCHAR(50), -- 'budget', 'execution', 'completion'
    status VARCHAR(20), -- 'pending', 'approved', 'rejected'
    approved_at TIMESTAMP,
    comments TEXT
);

-- Etapas do workflow
CREATE TABLE maintenance_workflow_steps (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    assigned_to INTEGER REFERENCES users(id)
);
```

#### 2. GESTÃO FINANCEIRA DETALHADA
```sql
-- Custos detalhados
CREATE TABLE maintenance_costs (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    cost_type VARCHAR(50), -- 'labor', 'parts', 'materials', 'external'
    description TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    approved_cost DECIMAL(10,2),
    supplier_name VARCHAR(255),
    invoice_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Peças utilizadas
CREATE TABLE maintenance_parts (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    part_code VARCHAR(50),
    part_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    supplier VARCHAR(255),
    warranty_months INTEGER
);

-- Mão de obra
CREATE TABLE maintenance_labor (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    technician_name VARCHAR(255),
    service_description TEXT,
    hours_worked DECIMAL(5,2),
    hourly_rate DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    work_date DATE
);
```

#### 3. GESTÃO DE DOCUMENTOS E INSPEÇÕES
```sql
-- Documentos de manutenção
CREATE TABLE maintenance_documents (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    document_type VARCHAR(50), -- 'invoice', 'certificate', 'photo', 'report'
    file_name VARCHAR(255),
    file_path TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inspeções pré e pós manutenção
CREATE TABLE maintenance_inspections (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    inspection_type VARCHAR(20), -- 'pre', 'post'
    inspector_id INTEGER REFERENCES users(id),
    inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checklist_items JSONB, -- Lista de itens verificados
    photos TEXT[], -- URLs das fotos
    notes TEXT,
    approved BOOLEAN DEFAULT false
);
```

#### 4. MANUTENÇÃO PREVENTIVA E AGENDAMENTOS
```sql
-- Cronogramas de manutenção preventiva
CREATE TABLE maintenance_schedules (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    service_type VARCHAR(100),
    interval_km INTEGER,
    interval_months INTEGER,
    last_service_km INTEGER,
    last_service_date DATE,
    next_service_km INTEGER,
    next_service_date DATE,
    is_active BOOLEAN DEFAULT true
);

-- Templates de serviços
CREATE TABLE maintenance_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    description TEXT,
    estimated_duration_hours INTEGER,
    estimated_cost DECIMAL(10,2),
    required_parts JSONB,
    checklist_items JSONB,
    created_by INTEGER REFERENCES users(id)
);

-- Categorias de manutenção
CREATE TABLE maintenance_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    priority_level INTEGER, -- 1=baixa, 2=média, 3=alta, 4=crítica
    max_response_time_hours INTEGER
);
```

#### 5. GESTÃO DE OFICINAS AVANÇADA
```sql
-- Contratos com oficinas
CREATE TABLE workshop_contracts (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER REFERENCES oficinas(id),
    contract_number VARCHAR(100),
    start_date DATE,
    end_date DATE,
    payment_terms TEXT,
    discount_percentage DECIMAL(5,2),
    service_level_agreement TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Especialidades das oficinas
CREATE TABLE workshop_specialties (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER REFERENCES oficinas(id),
    specialty_type VARCHAR(100), -- 'engine', 'transmission', 'brakes', 'electrical'
    certification_level VARCHAR(50),
    certified_until DATE
);

-- Avaliações de serviço
CREATE TABLE workshop_service_ratings (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    workshop_id INTEGER REFERENCES oficinas(id),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    cost_rating INTEGER CHECK (cost_rating >= 1 AND cost_rating <= 5),
    overall_rating DECIMAL(3,2),
    comments TEXT,
    rated_by INTEGER REFERENCES users(id),
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. HISTÓRICO E RELATÓRIOS
```sql
-- Histórico completo de manutenção por veículo
CREATE TABLE vehicle_maintenance_history (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    maintenance_id INTEGER REFERENCES manutencao(id),
    service_date DATE,
    mileage_at_service INTEGER,
    service_type VARCHAR(100),
    total_cost DECIMAL(10,2),
    next_service_due_km INTEGER,
    next_service_due_date DATE
);

-- Log de auditoria
CREATE TABLE maintenance_audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    record_id INTEGER,
    action VARCHAR(20), -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 📊 VIEWS FALTANTES IMPORTANTES

```sql
-- Dashboard de manutenção
CREATE VIEW maintenance_dashboard AS
SELECT 
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN status = 'concluida' THEN 1 END) as completed_count,
    AVG(custo) as average_cost,
    AVG(EXTRACT(DAY FROM data_conclusao - data_solicitacao)) as avg_completion_days
FROM manutencao
WHERE data_solicitacao >= CURRENT_DATE - INTERVAL '30 days';

-- Próximas manutenções preventivas
CREATE VIEW upcoming_preventive_maintenance AS
SELECT 
    v.plate,
    ms.service_type,
    ms.next_service_date,
    ms.next_service_km,
    v.mileage as current_km,
    (ms.next_service_km - v.mileage) as km_remaining
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE ms.is_active = true
AND (ms.next_service_date <= CURRENT_DATE + INTERVAL '30 days'
     OR ms.next_service_km <= v.mileage + 1000);

-- Performance das oficinas
CREATE VIEW workshop_performance AS
SELECT 
    o.razao_social,
    COUNT(m.id) as total_services,
    AVG(m.custo) as avg_cost,
    AVG(EXTRACT(DAY FROM m.data_conclusao - m.data_agendada)) as avg_completion_time,
    AVG(r.overall_rating) as avg_rating
FROM oficinas o
LEFT JOIN manutencao m ON o.id = m.oficina_id
LEFT JOIN workshop_service_ratings r ON o.id = r.workshop_id
WHERE m.data_solicitacao >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY o.id, o.razao_social;
```

### 🔧 FUNCIONALIDADES FALTANTES NO SISTEMA

1. **Workflow Automatizado**: Sistema de aprovações em múltiplas etapas
2. **Gestão de Orçamentos**: Controle de custos estimados vs realizados
3. **Manutenção Preventiva**: Agendamento automático baseado em KM e tempo
4. **Relatórios Avançados**: Dashboards de performance e custos
5. **Integração com Estoque**: Controle de peças e materiais
6. **Notificações**: Alertas para manutenções vencidas
7. **Controle de Qualidade**: Sistema de avaliação de serviços
8. **Auditoria**: Log completo de todas as alterações

### 📝 PRÓXIMOS PASSOS RECOMENDADOS

1. Criar tabelas de workflow e status history
2. Implementar sistema de aprovações
3. Adicionar gestão financeira detalhada
4. Criar sistema de manutenção preventiva
5. Implementar relatórios e dashboards
6. Adicionar sistema de avaliações
7. Criar APIs para integração mobile
8. Implementar notificações automáticas
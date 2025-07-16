# Relatório de Análise: Painel Operacional da Frota
## Fontes de Dados e Fluxo de Informações

**Data de Análise:** 16 de julho de 2025  
**Arquivo Analisado:** `/client/src/pages/PainelOperacional.tsx` e `/server/routes/operationalDashboard.ts`

## Visão Geral do Sistema

O Painel Operacional da Frota exibe indicadores em tempo real divididos em duas categorias principais:
- **Manutenção**: Indicadores de veículos em manutenção, tempo médio e custos
- **Abastecimento**: Dados de consumo de combustível, litros e análises mensais

## Estrutura de Dados das APIs

### 1. SEÇÃO MANUTENÇÃO (`/api/operational-dashboard/maintenance`)

#### Fonte de Dados Principal
- **Tabela:** `maintenance_orders` (ordens de manutenção)
- **Tabela Relacionada:** `vehicles` (veículos)
- **Tabelas de Oficinas:** `workshops` e `oficinas`

#### Indicadores Calculados

##### 1.1 Veículos em Manutenção
```sql
SELECT COUNT(*) as count
FROM maintenance_orders mo
JOIN vehicles v ON mo.vehicle_id = v.id
WHERE mo.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
```
- **Exibição:** Card com ícone de ferramenta
- **Valor:** Número total de veículos

##### 1.2 Tempo Médio de Manutenção
```sql
SELECT AVG(
  CASE 
    WHEN mo.status = 'concluida' AND mo.completion_date IS NOT NULL 
    THEN EXTRACT(DAY FROM (mo.completion_date - mo.created_at))
    ELSE EXTRACT(DAY FROM (NOW() - mo.created_at))
  END
) as avg_days
FROM maintenance_orders mo
JOIN vehicles v ON mo.vehicle_id = v.id
```
- **Exibição:** Card com ícone de relógio
- **Valor:** Dias (arredondado)

##### 1.3 Veículos Parados Mais de 5 Dias
```sql
SELECT 
  mo.id,
  v.plate,
  EXTRACT(DAY FROM (NOW() - mo.created_at)) as days_in_maintenance,
  COALESCE(w.name, o.name, 'Oficina não informada') as workshop,
  mo.created_at as entry_date
FROM maintenance_orders mo
JOIN vehicles v ON mo.vehicle_id = v.id
LEFT JOIN workshops w ON mo.workshop_id = w.id
LEFT JOIN oficinas o ON mo.oficina_id = o.id
WHERE mo.status IN ('pendente', 'em_andamento', 'aguardando_pecas')
  AND EXTRACT(DAY FROM (NOW() - mo.created_at)) > 5
ORDER BY days_in_maintenance DESC
```
- **Exibição:** Card com ícone de alerta
- **Valor:** Número de veículos + lista detalhada

##### 1.4 Custo Total de Manutenção
```sql
SELECT 
  SUM(COALESCE(mo.labor_cost, 0) + COALESCE(mo.parts_cost, 0)) as total_cost,
  COUNT(*) as total_orders
FROM maintenance_orders mo
JOIN vehicles v ON mo.vehicle_id = v.id
```
- **Exibição:** Card com ícone de dinheiro
- **Valor:** Custo total em reais

### 2. SEÇÃO ABASTECIMENTO (`/api/operational-dashboard/fuel`)

#### Fonte de Dados Principal
O sistema utiliza uma estratégia de fallback para obter dados de combustível:

##### 2.1 Primeira Tentativa: View Consolidada
- **Tabela:** `historico_consolidado_abastecimentos`
- **Vantagem:** Dados unificados de todos os postos

##### 2.2 Fallback: Tabelas Individuais
Se a view não estiver disponível, consulta tabelas individuais:
- `abastecimentos_posto_abc_v2`
- `abastecimentos_posto_campinas_v2`
- `abastecimentos_posto_osasco_v2`
- `abastecimentos_posto_guarulhos_v2`
- `abastecimentos_posto_socorro_v2`
- `abastecimentos_posto_sorocaba_v2`
- `abastecimentos_posto_alair_v2`

#### Indicadores Calculados

##### 2.1 Total de Abastecimentos
```sql
SELECT COUNT(*) as total_refuels
FROM [tabela_combustivel]
WHERE data_abastecimento >= DATE_TRUNC('month', NOW())
```

##### 2.2 Litros por Tipo de Combustível
```sql
SELECT 
  SUM(CASE WHEN tipo_combustivel = 'Diesel' THEN litros_abastecidos ELSE 0 END) as diesel_liters,
  SUM(CASE WHEN tipo_combustivel = 'Gasolina' THEN litros_abastecidos ELSE 0 END) as gasoline_liters,
  SUM(CASE WHEN tipo_combustivel = 'Alcool' OR tipo_combustivel = 'Etanol' THEN litros_abastecidos ELSE 0 END) as alcohol_liters
FROM [tabela_combustivel]
```

##### 2.3 Consumo Médio
```sql
SELECT 
  SUM(litros_abastecidos) as total_liters,
  SUM(km_rodados) as total_km
FROM [tabela_combustivel]
```
- **Cálculo:** `total_liters / total_km`
- **Exibição:** Card com valor em L/km

##### 2.4 Dados Mensais para Gráfico
```sql
SELECT 
  TO_CHAR(data_abastecimento, 'YYYY-MM') as month,
  COUNT(*) as refuels,
  SUM(litros_abastecidos) as liters,
  SUM(valor_total) as cost
FROM historico_consolidado_abastecimentos
WHERE data_abastecimento >= NOW() - INTERVAL '6 months'
GROUP BY TO_CHAR(data_abastecimento, 'YYYY-MM')
ORDER BY month DESC
LIMIT 6
```

## Sistema de Filtros

### Filtros Disponíveis
1. **Base:** Filtro por `base_id` 
2. **Projeto:** Filtro por `project_id`
3. **Data Inicial:** Filtro por `created_at` (manutenção) / `data_abastecimento` (combustível)
4. **Data Final:** Filtro por `created_at` (manutenção) / `data_abastecimento` (combustível)
5. **Período:** Seletor de período (semana/mês)

### Carregamento dos Filtros
- **Bases:** `/api/bases` - Carrega todas as bases disponíveis
- **Projetos:** `/api/projects` - Carrega todos os projetos ativos

## Fluxo de Dados Frontend

### 1. Inicialização
```typescript
// Carrega bases e projetos para filtros
const [basesResponse, projectsResponse] = await Promise.all([
  fetch('/api/bases'),
  fetch('/api/projects')
]);
```

### 2. Carregamento de Dados
```typescript
// Carrega dados do dashboard com filtros aplicados
const [maintenanceResponse, fuelResponse] = await Promise.all([
  fetch(`/api/operational-dashboard/maintenance?${queryParams}`),
  fetch(`/api/operational-dashboard/fuel?${queryParams}`)
]);
```

### 3. Exibição
- **Cards de Resumo:** Exibem métricas principais
- **Gráficos:** Visualização de dados de combustível por tipo
- **Tabela:** Lista de veículos com mais de 5 dias parados

## Estrutura de Resposta das APIs

### Maintenance API Response
```json
{
  "vehiclesInMaintenance": 0,
  "averageMaintenanceDays": 0,
  "vehiclesOver5Days": [
    {
      "id": 1,
      "plate": "ABC1234",
      "daysInMaintenance": 7,
      "workshop": "Oficina Teste",
      "entryDate": "2025-07-09T00:00:00Z"
    }
  ],
  "totalMaintenanceCost": 0,
  "averageCostPerVehicle": 0
}
```

### Fuel API Response
```json
{
  "totalRefuels": 0,
  "totalLiters": {
    "diesel": 0,
    "gasoline": 0,
    "alcohol": 0
  },
  "averageConsumption": 0,
  "monthlyData": [
    {
      "month": "2025-07",
      "refuels": 0,
      "liters": 0,
      "cost": 0
    }
  ]
}
```

## Possíveis Pontos de Melhoria

### 1. Performance
- Criar índices nas colunas utilizadas nos filtros
- Implementar cache para consultas frequentes
- Otimizar consultas com muitos JOINs

### 2. Confiabilidade
- Verificar se todas as tabelas de postos estão sendo incluídas
- Implementar validação de dados antes da exibição
- Adicionar tratamento de erro mais robusto

### 3. Funcionalidades
- Adicionar filtros por tipo de combustível
- Implementar alertas para veículos parados há muito tempo
- Criar relatórios exportáveis

## Conclusão

O Painel Operacional funciona como um dashboard central que consolida dados de manutenção e abastecimento, fornecendo uma visão unificada da operação da frota. Os dados são obtidos diretamente das tabelas operacionais do sistema, garantindo informações em tempo real para tomada de decisões.

**Status Atual:** Sistema funcional com autenticação reativada
**Próximos Passos:** Verificar dados reais nas tabelas para validar as métricas exibidas
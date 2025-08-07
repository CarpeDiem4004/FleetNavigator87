# Análise: Fonte de Dados "Quilometragem por Base (Comparativo Mensal)"

## Resumo Executivo
Os dados exibidos no gráfico "Quilometragem por Base (Comparativo Mensal)" do dashboard **ATUALMENTE SÃO SIMULADOS** e não refletem dados reais do banco de dados. O sistema está usando dados de demonstração hardcoded.

## Status Atual: DADOS SIMULADOS

### Localização do Código Responsável
1. **Frontend**: `/client/src/components/dashboard/DashboardCharts.tsx` (linhas 144-185)
2. **Dados**: `/client/src/utils/dashboardData.ts` (linhas 161-166)
3. **API**: `/server/dashboardKpiApi.ts` (linhas 217-250)

### Como os Dados São Gerados Atualmente

#### Dados Simulados (Linha 161-166 do dashboardData.ts):
```javascript
// Quilometragem por base
const baseNames = ['São Paulo', 'Campinas', 'Guarulhos', 'ABC', 'Sorocaba', 'Osasco'];
const kmPerBase = baseNames.map(base => ({
  base,
  currentMonth: randomValue(15000, 35000, 0),    // Valores aleatórios entre 15.000 e 35.000 km
  previousMonth: randomValue(15000, 35000, 0)    // Valores aleatórios entre 15.000 e 35.000 km
}));
```

### Fluxo de Dados Atual:
1. **Frontend faz requisição**: `GET /api/dashboard/kpis`
2. **Backend responde** com dados básicos (veículos, manutenção, pneus, combustível)
3. **Frontend detecta** que não há dados de `kmPerBase` na resposta da API
4. **Sistema usa dados simulados** da função `generateDashboardData()`
5. **Gráfico exibe dados aleatórios** gerados dinamicamente

## Problema Identificado

### O que está acontecendo:
- A API `/api/dashboard/kpis` NÃO retorna dados de `kmPerBase`
- O frontend detecta que os dados não estão no formato esperado
- Sistema automaticamente usa dados simulados como fallback
- Console exibe: *"API de dashboard não retornou dados no formato esperado, usando dados simulados"*

### Dados Reais Disponíveis no Sistema:
O sistema possui várias tabelas com dados de quilometragem real:
- `historico_consolidado_abastecimentos` (com campo `km`)
- `abastecimentos` (com campos de quilometragem)
- `veiculos` (com informações de base)
- `bases` (com informações das bases)
- Múltiplas tabelas de abastecimento por posto: `abastecimentos_posto_*`

## Solução Necessária

### Para Implementar Dados Reais:

1. **Modificar API `/api/dashboard/kpis`** para incluir consulta real de quilometragem por base:
   ```sql
   SELECT 
     b.name as base,
     COALESCE(SUM(CASE WHEN DATE_TRUNC('month', h.data_abastecimento) = DATE_TRUNC('month', CURRENT_DATE) 
                       THEN h.km ELSE 0 END), 0) as currentMonth,
     COALESCE(SUM(CASE WHEN DATE_TRUNC('month', h.data_abastecimento) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                       THEN h.km ELSE 0 END), 0) as previousMonth
   FROM bases b
   LEFT JOIN veiculos v ON v.base_id = b.id
   LEFT JOIN historico_consolidado_abastecimentos h ON h.veiculo_id = v.id
   GROUP BY b.id, b.name
   ORDER BY b.name
   ```

2. **Atualizar estrutura da resposta da API** para incluir o campo `kmPerBase`

3. **Manter fallback** para dados simulados apenas durante desenvolvimento/teste

## Impacto
- **Alta**: Decisões estratégicas baseadas em dados incorretos
- **Confiabilidade**: Dashboard não reflete realidade operacional
- **Credibilidade**: Usuários podem questionar precisão do sistema

## Recomendação
**PRIORIDADE ALTA**: Implementar consulta real ao banco de dados para obter quilometragem real por base, substituindo os dados simulados por informações autênticas do sistema.

## Bases Atualmente Simuladas:
- São Paulo
- Campinas  
- Guarulhos
- ABC
- Sorocaba
- Osasco

**Data da Análise**: 07 de Agosto de 2025
**Analista**: Sistema Murici On Fleet 2.0
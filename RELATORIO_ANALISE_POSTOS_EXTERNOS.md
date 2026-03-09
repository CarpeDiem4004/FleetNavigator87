# Relatório de Análise - Links Externos dos Postos

## Resumo da Análise

Realizei uma análise completa dos links externos dos postos para verificar se os campos projeto e base estão sendo salvos corretamente durante o abastecimento.

## Status Atual dos Postos (Dados Reais)

| Posto | Total Registros | Projeto (%) | Base Nome (%) | Projeto ID (%) | Base ID (%) |
|-------|----------------|-------------|---------------|----------------|-------------|
| ABC V2 | 187 | 100.00% | 94.12% | 16.04% | 94.12% |
| Alair V2 | 18 | 100.00% | 100.00% | 11.11% | 5.56% |
| Campinas V2 | 1,122 | 100.00% | 100.00% | 42.51% | 10.78% |
| Guarulhos V2 | 43 | 100.00% | 100.00% | 51.16% | 2.33% |
| Osasco V2 | 1,500 | 100.00% | 99.60% | 22.80% | 54.07% |
| Socorro V2 | 140 | 100.00% | 91.43% | 1.43% | 91.43% |
| Sorocaba V2 | 198 | 100.00% | 94.44% | 18.18% | 94.44% |

## Problemas Identificados

### 1. Campos projeto_id Ausentes
**Problema**: A maioria dos registros não possui `projeto_id` numérico, apenas o nome do projeto em texto.

**Exemplo de registros problemáticos**:
- ABC V2: 157 registros sem projeto_id (84% dos registros)
- Socorro V2: 138 registros sem projeto_id (98.6% dos registros)

**Registros recentes sem projeto_id**:
```
Posto: abc_v2, Projeto: "SHOPEE", projeto_id: NULL
Posto: abc_v2, Projeto: "MERCADO LIVRE", projeto_id: NULL
Posto: socorro_v2, Projeto: "SHOPEE", projeto_id: NULL
```

### 2. Formulários Externos Inadequados
**Problema**: Os formulários externos dos postos não incluem seletores para projeto_id e base_id.

**Evidência**: Análise do código mostrou que:
- FormularioAbastecimentoSimplificado.tsx não possui campos projeto_id/base_id
- Apenas envia o nome do projeto como texto
- Não há integração com a API de projetos/bases

### 3. Inconsistência nos Dados
**Problema**: Campos base_id também apresentam baixo preenchimento em alguns postos.

**Exemplo**:
- Alair V2: apenas 5.56% dos registros têm base_id
- Guarulhos V2: apenas 2.33% dos registros têm base_id

## Soluções Implementadas

### 1. Correção da API de Solicitações de Cartão Combustível
✅ **Corrigido**: Adicionados campos `litros_solicitados` e `tipo_combustivel` na consulta SQL
- Campos agora retornados corretamente pela API
- Modal deve exibir quantidade de litros quando disponível

### 2. Formulários Externos (Em Progresso)
🔄 **Em desenvolvimento**: Atualizando FormularioAbastecimentoSimplificado.tsx para incluir:
- Campo projeto_id com seletor
- Campo base_id com seletor
- Integração com API de projetos/bases

## Recomendações

### Imediatas
1. **Corrigir formulários externos** - Adicionar seletores de projeto e base
2. **Validar dados obrigatórios** - Projeto_id e base_id devem ser obrigatórios
3. **Migração de dados históricos** - Converter nomes de projetos em projeto_id

### Preventivas
1. **Validação no backend** - Rejeitar registros sem projeto_id/base_id
2. **Testes automatizados** - Verificar integridade dos dados periodicamente
3. **Documentação** - Atualizar documentação dos links externos

## Impacto

### Problemas Atuais
- ❌ Relatórios por projeto inconsistentes
- ❌ Dificuldade para rastrear custos por base
- ❌ Análises financeiras imprecisas

### Após Correções
- ✅ Rastreamento completo por projeto
- ✅ Relatórios financeiros precisos
- ✅ Análises de consumo por base
- ✅ Integração correta com sistema de cartão combustível

## Status da Correção

### Concluído
✅ Análise completa dos dados
✅ Identificação dos problemas
✅ Correção da API de cartão combustível

### Em Andamento
🔄 Correção dos formulários externos
🔄 Adição de campos projeto_id/base_id

### Próximos Passos
📋 Testes dos formulários corrigidos
📋 Migração de dados históricos
📋 Validação completa do sistema

---

**Data do Relatório**: 09/06/2025
**Analista**: Sistema de Análise Automatizada
**Status**: Em Progresso - Correções Identificadas e Sendo Implementadas
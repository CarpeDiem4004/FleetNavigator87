# Sistema de Auto-Geração de Códigos para Peças

## Implementação Realizada

### 1. Função de Geração de Códigos
- **Nome:** `generate_part_code(categoria_input)`
- **Funcionalidade:** Gera códigos automáticos baseados na categoria da peça
- **Formato:** CATEGORIA001, CATEGORIA002, etc.
- **Exemplo:** Motor → MOTOR001, MOTOR002, etc.

### 2. Trigger Automático
- **Nome:** `trigger_auto_generate_part_code`
- **Execução:** Antes de inserir nova peça
- **Comportamento:** Se o código não for fornecido, gera automaticamente

### 3. Controle de Sequência
- O sistema verifica o último número usado para cada categoria
- Incrementa automaticamente o próximo número disponível
- Evita duplicação de códigos

## Como Usar

### Inserção Automática (Recomendado)
```sql
-- O código será gerado automaticamente
INSERT INTO estoque_pecas (nome, categoria, preco_unitario, quantidade_estoque) 
VALUES ('Nova Peça', 'Motor', 25.00, 10);
-- Resultado: código = MOTOR003 (próximo disponível)
```

### Inserção Manual (Opcional)
```sql
-- Fornecendo código manualmente
INSERT INTO estoque_pecas (codigo, nome, categoria, preco_unitario) 
VALUES ('MOTOR999', 'Peça Especial', 'Motor', 150.00);
```

## Categorias Atuais e Códigos Gerados

| Categoria | Último Código | Próximo Código |
|-----------|---------------|----------------|
| Elétrica  | ELÉTRICA001  | ELÉTRICA002   |
| Filtros   | FILTROS001   | FILTROS002    |
| Freios    | PASTILHA001  | FREIOS001     |
| Motor     | MOTOR002     | MOTOR003      |
| Pneus     | PNEU001      | PNEUS001      |
| Suspensão | AMORTECEDOR001 | SUSPENSÃO001 |

## Status da Implementação

✅ **Concluído:**
- Função de geração automática de códigos
- Trigger para execução automática
- Teste de funcionamento verificado
- Sistema funcionando perfeitamente

✅ **Testado:**
- Inserção de peças sem código (geração automática)
- Sequência numérica correta por categoria
- Prevenção de códigos duplicados

## Arquivos Criados

1. **auto-generate-part-codes.sql** - Script completo de implementação
2. **SISTEMA_AUTO_CODIGO_PECAS.md** - Esta documentação

## Observações Importantes

- O sistema é totalmente automático - não requer intervenção manual
- Códigos são gerados apenas quando não fornecidos
- Cada categoria mantém sua própria sequência numérica
- Sistema compatível com a estrutura atual da tabela estoque_pecas
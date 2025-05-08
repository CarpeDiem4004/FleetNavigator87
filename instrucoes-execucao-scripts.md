# Instruções para Criação das Tabelas no Supabase

Dividi o script em partes menores para evitar erros de sintaxe durante a execução. Siga as etapas abaixo na ordem indicada para configurar corretamente todas as tabelas necessárias no Supabase.

## Arquivos de Script SQL

1. **create-recebimentos-tables-supabase.sql**
   - Cria as tabelas de recebimentos para todos os postos
   - Execute este script primeiro

2. **create-movimentacoes-tables-supabase.sql**
   - Cria as tabelas de movimentações de pátio para todos os postos
   - Execute este script em segundo lugar

3. **create-abastecimentos-tables-supabase.sql**
   - Cria as tabelas de abastecimentos para os postos que ainda não têm (ABC_v2, Alair_v2, Guarulhos_v2)
   - Execute este script em terceiro lugar

4. **create-view-historico-postos.sql**
   - Cria a view consolidada para exibir o histórico de todos os postos
   - Execute este script em quarto lugar

5. **create-configuracoes-tanques.sql**
   - Adiciona as configurações iniciais dos tanques para todos os postos
   - Execute este script por último

## Instruções para Execução

1. Acesse o painel administrativo do Supabase
2. Vá para a seção SQL ou Editor SQL
3. Copie e cole o conteúdo de cada arquivo na ordem recomendada
4. Execute um script por vez e verifique se não há erros antes de prosseguir para o próximo

## Verificação

Após a execução de todos os scripts, você pode verificar se as tabelas foram criadas corretamente executando as seguintes consultas:

```sql
-- Verificar tabelas de recebimentos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'recebimentos_posto_%'
ORDER BY table_name;

-- Verificar tabelas de movimentações
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'movimentacoes_patio_%'
ORDER BY table_name;

-- Verificar configurações dos tanques
SELECT * FROM configuracao_tanques;

-- Verificar view de histórico
SELECT * FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'historico_consolidado_postos';
```

## Observações Importantes

- Se algum script gerar erro, verifique a mensagem e corrija antes de continuar
- A view `historico_consolidado_postos` depende da existência de todas as tabelas de abastecimentos, portanto execute-a somente após criar todas as tabelas
- As configurações dos tanques só serão inseridas se não existirem previamente para evitar duplicação
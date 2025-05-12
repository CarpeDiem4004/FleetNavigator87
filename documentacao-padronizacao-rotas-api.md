# Documentação de Padronização de Rotas da API

## Visão Geral
Este documento descreve o padrão simplificado de rotas de API implementado no sistema de gestão de frotas. O objetivo é padronizar os endpoints de API para facilitar a integração com sistemas externos e melhorar a consistência em todo o código.

## Padrão de URLs

### Formato Original vs. Simplificado

| Tipo | Formato Original | Formato Simplificado |
|------|------------------|----------------------|
| API Híbrida | `/api/hybrid/users` | `/users` |
| API Híbrida (Auth) | `/api/hybrid/auth/login` | `/auth/login` |
| API Resiliente | `/api/resilient/multas` | `/multas` |
| API Resiliente (Operações) | `/api/resilient/multas/:id/status` | `/multas/:id/status` |

## Motivação

1. **Consistência:** Manter o mesmo padrão de endpoints em todo o sistema.
2. **Simplicidade:** Reduzir a verbosidade dos caminhos de API.
3. **Facilidade de manutenção:** Permitir que o sistema evolua com mais facilidade.
4. **Compatibilidade:** Manter compatibilidade com códigos existentes durante a transição.

## Implementação

A implementação está sendo feita de forma gradual, com atualizações nos seguintes componentes:

1. **Documentação das Rotas:** Cada rota agora documenta tanto o caminho original quanto o simplificado.
2. **Clientes de API:** O cliente resilientApiClient e hybridUserService foram atualizados para usar os novos caminhos.
3. **Rotas do Servidor:** As rotas do servidor estão mantendo compatibilidade com ambos os formatos.

## Exemplo de Documentação de Rota

```typescript
/**
 * Rota para listar multas com filtros opcionais
 * GET /api/resilient/multas (caminho simplificado: /multas)
 */
router.get('/multas', async (req: Request, res: Response) => {
  // implementação
});
```

## Transição

Durante o período de transição, todas as rotas serão acessíveis tanto pelo caminho original quanto pelo simplificado. Após a migração completa, os caminhos originais serão mantidos por compatibilidade, mas novos desenvolvimentos devem usar exclusivamente os caminhos simplificados.

## Clientes de API Atualizados

1. `resilientApiClient`: Configurado para usar `/api/universal` como baseURL.
2. `hybridUserService`: Configurado para usar `/api/hybrid` como baseURL.

## Próximos Passos

1. Atualizar a documentação de todas as rotas restantes.
2. Avaliar e atualizar testes de API.
3. Comunicar a mudança para equipes de integração.
# Documentação da API de Checklists de Motoristas

## Visão Geral

A API de Checklists de Motoristas fornece endpoints para gerenciar formulários de inspeção veicular preenchidos pelos motoristas antes e depois das viagens. Permite criar, ler, atualizar e excluir registros de checklist, além de filtrar por diversos critérios.

## Base URL

```
https://muricionfleet-joaopaulo60.replit.app/api/driver-checklists
```

## Autenticação

A API utiliza autenticação via cookies de sessão ou token JWT. Para acessar os endpoints, você precisa estar autenticado no sistema.

## Estrutura do Checklist

Um registro de checklist contém os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer | Identificador único do checklist |
| driver_id | Integer | ID do motorista (opcional) |
| driver_name | String | Nome do motorista |
| driver_type | String | Tipo do motorista (proprio, terceiro) |
| vehicle_plate | String | Placa do veículo |
| km_atual | Integer | Quilometragem atual do veículo |
| condicao_pneus | String | Condição dos pneus (Bom, Regular, Ruim) |
| condicao_luzes | String | Condição das luzes (Bom, Regular, Ruim) |
| condicao_freios | String | Condição dos freios (Bom, Regular, Ruim) |
| condicao_parabrisa | String | Condição do parabrisa (Bom, Regular, Ruim) |
| nivel_oleo | String | Nível do óleo (Normal, Baixo) |
| nivel_agua | String | Nível da água/líquido de arrefecimento (Normal, Baixo) |
| estrutura_cavalo | String | Condição da estrutura do caminhão/cavalo (OK, Com avarias) |
| estrutura_carreta | String | Condição da estrutura da carreta (OK, Com avarias) |
| avarias | Array | Lista de avarias detectadas |
| fotos | Array | Lista de URLs de fotos das avarias (opcional) |
| observacoes | String | Observações gerais sobre o veículo |
| status | String | Status do checklist (ativo, pendente, resolvido) |
| viagem_id | Integer | ID da viagem associada (opcional) |
| source | String | Origem do checklist (nome do posto, api) |
| created_at | Timestamp | Data e hora de criação |
| updated_at | Timestamp | Data e hora da última atualização |

## Endpoints

### Listar todos os checklists

```
GET /api/driver-checklists
```

**Parâmetros de consulta:**
- `driver_name`: Filtra por nome do motorista (parcial)
- `vehicle_plate`: Filtra por placa do veículo (parcial)
- `status`: Filtra por status (ativo, pendente, resolvido)
- `driver_type`: Filtra por tipo de motorista (proprio, terceiro)
- `source`: Filtra pela origem do checklist
- `posto`: Filtra por nome do posto (parcial)
- `viagem_id`: Filtra pelo ID da viagem
- `limit`: Limite de registros retornados (padrão: 50)

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "driver_name": "Carlos Motorista",
      "vehicle_plate": "XYZ5678",
      "km_atual": 75000,
      "condicao_pneus": "Bom",
      "condicao_luzes": "Bom",
      "condicao_freios": "Bom",
      "condicao_parabrisa": "Bom",
      "nivel_oleo": "Normal",
      "nivel_agua": "Normal",
      "estrutura_cavalo": "OK",
      "estrutura_carreta": "Com avarias",
      "avarias": ["Amassado na lateral direita", "Retrovisor quebrado"],
      "fotos": null,
      "observacoes": "Manutenção nos pneus concluída. Parabrisa substituído.",
      "status": "resolvido",
      "driver_type": "proprio",
      "source": "posto_osasco_v2",
      "created_at": "2025-05-06T18:57:00.750Z",
      "updated_at": "2025-05-06T18:57:18.488Z"
    }
  ],
  "count": 1,
  "filters": {
    "driver_name": null,
    "vehicle_plate": null,
    "status": null,
    "driver_type": null,
    "source": null,
    "posto": null,
    "viagem_id": null
  }
}
```

### Obter um checklist específico

```
GET /api/driver-checklists/:id
```

**Parâmetros de URL:**
- `id`: ID do checklist a ser obtido

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "driver_name": "Carlos Motorista",
    "vehicle_plate": "XYZ5678",
    "km_atual": 75000,
    "condicao_pneus": "Bom",
    "condicao_luzes": "Bom",
    "condicao_freios": "Bom",
    "condicao_parabrisa": "Bom",
    "nivel_oleo": "Normal",
    "nivel_agua": "Normal",
    "estrutura_cavalo": "OK",
    "estrutura_carreta": "Com avarias",
    "avarias": ["Amassado na lateral direita", "Retrovisor quebrado"],
    "fotos": null,
    "observacoes": "Manutenção nos pneus concluída. Parabrisa substituído.",
    "status": "resolvido",
    "driver_type": "proprio",
    "source": "posto_osasco_v2",
    "created_at": "2025-05-06T18:57:00.750Z",
    "updated_at": "2025-05-06T18:57:18.488Z"
  }
}
```

### Obter checklists por posto

```
GET /api/driver-checklists/posto/:posto
```

**Parâmetros de URL:**
- `posto`: Nome do posto a filtrar

**Parâmetros de consulta:**
- `limit`: Limite de registros retornados (padrão: 50)

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "driver_name": "Carlos Motorista",
      "vehicle_plate": "XYZ5678",
      "km_atual": 75000,
      "condicao_pneus": "Bom",
      "condicao_luzes": "Bom",
      "condicao_freios": "Bom",
      "condicao_parabrisa": "Bom",
      "nivel_oleo": "Normal",
      "nivel_agua": "Normal",
      "estrutura_cavalo": "OK",
      "estrutura_carreta": "Com avarias",
      "avarias": ["Amassado na lateral direita", "Retrovisor quebrado"],
      "fotos": null,
      "observacoes": "Manutenção nos pneus concluída. Parabrisa substituído.",
      "status": "resolvido",
      "driver_type": "proprio",
      "source": "posto_osasco_v2",
      "created_at": "2025-05-06T18:57:00.750Z",
      "updated_at": "2025-05-06T18:57:18.488Z"
    }
  ],
  "count": 1,
  "posto": "osasco_v2"
}
```

### Criar um novo checklist

```
POST /api/driver-checklists
```

**Corpo da requisição:**
```json
{
  "driver_name": "Carlos Motorista",
  "vehicle_plate": "XYZ5678",
  "km_atual": 75000,
  "condicao_pneus": "Regular",
  "condicao_luzes": "Bom",
  "condicao_freios": "Bom",
  "condicao_parabrisa": "Regular",
  "nivel_oleo": "Baixo",
  "nivel_agua": "Normal",
  "estrutura_cavalo": "OK",
  "estrutura_carreta": "Com avarias",
  "avarias": ["Amassado na lateral direita", "Retrovisor quebrado"],
  "observacoes": "Necessita manutenção nos pneus e parabrisa",
  "status": "pendente",
  "driver_type": "proprio",
  "source": "posto_osasco_v2"
}
```

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "driver_name": "Carlos Motorista",
    "vehicle_plate": "XYZ5678",
    "km_atual": 75000,
    "condicao_pneus": "Regular",
    "condicao_luzes": "Bom",
    "condicao_freios": "Bom",
    "condicao_parabrisa": "Regular",
    "nivel_oleo": "Baixo",
    "nivel_agua": "Normal",
    "estrutura_cavalo": "OK",
    "estrutura_carreta": "Com avarias",
    "avarias": ["Amassado na lateral direita", "Retrovisor quebrado"],
    "fotos": null,
    "observacoes": "Necessita manutenção nos pneus e parabrisa",
    "status": "pendente",
    "driver_type": "proprio",
    "source": "posto_osasco_v2",
    "created_at": "2025-05-06T18:57:00.750Z",
    "updated_at": "2025-05-06T18:57:00.750Z"
  },
  "message": "Checklist criado com sucesso"
}
```

### Atualizar um checklist

```
PUT /api/driver-checklists/:id
```

**Parâmetros de URL:**
- `id`: ID do checklist a ser atualizado

**Corpo da requisição:**
```json
{
  "status": "resolvido",
  "observacoes": "Manutenção nos pneus concluída. Parabrisa substituído.",
  "nivel_oleo": "Normal",
  "condicao_parabrisa": "Bom",
  "condicao_pneus": "Bom"
}
```

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "driver_name": "Carlos Motorista",
    "vehicle_plate": "XYZ5678",
    "km_atual": 75000,
    "condicao_pneus": "Bom",
    "condicao_luzes": "Bom",
    "condicao_freios": "Bom",
    "condicao_parabrisa": "Bom",
    "nivel_oleo": "Normal",
    "nivel_agua": "Normal",
    "estrutura_cavalo": "OK",
    "estrutura_carreta": "Com avarias",
    "avarias": ["Amassado na lateral direita", "Retrovisor quebrado"],
    "fotos": null,
    "observacoes": "Manutenção nos pneus concluída. Parabrisa substituído.",
    "status": "resolvido",
    "driver_type": "proprio",
    "source": "posto_osasco_v2",
    "created_at": "2025-05-06T18:57:00.750Z",
    "updated_at": "2025-05-06T18:57:18.488Z"
  },
  "message": "Checklist atualizado com sucesso"
}
```

### Excluir um checklist

```
DELETE /api/driver-checklists/:id
```

**Parâmetros de URL:**
- `id`: ID do checklist a ser excluído

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": {
    "id": 2
  },
  "message": "Checklist excluído com sucesso"
}
```

## Códigos de status

- `200 OK`: Operação concluída com sucesso (GET, PUT)
- `201 Created`: Recurso criado com sucesso (POST)
- `400 Bad Request`: Parâmetros inválidos ou ausentes
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro no servidor

## Erros

Em caso de erro, a API retorna uma resposta com a seguinte estrutura:

```json
{
  "success": false,
  "error": "Mensagem de erro detalhada"
}
```

## Dicas de Utilização

1. **Campos Obrigatórios**: Ao criar um checklist, os campos `driver_name` e `vehicle_plate` são obrigatórios.
2. **Campos Array**: Os campos `avarias` e `fotos` devem ser enviados como arrays de strings.
3. **Timestamp Automático**: Os campos `created_at` e `updated_at` são preenchidos automaticamente.
4. **Filtros Parciais**: Os filtros por texto (driver_name, vehicle_plate, source) aceitam correspondências parciais.
5. **Campo source**: Recomenda-se utilizar o formato `posto_[nome]` para facilitar a identificação da origem do checklist.
# Esquema de Dados — Game Library Dashboard (Flat API Format)

Este documento descreve a estrutura JSON atual de cada jogo, compatível com a API do backend FastAPI.

## Estrutura Completa

```json
{
	"id": "06b6d2167670",
	"playnite_id": null,
	"title": "Starfall Frontier",
	"cover_url": "https://images.igdb.com/.../co1wyy.jpg",
	"background_url": "https://images.igdb.com/.../sc867u.jpg",
	"genres": ["Estratégia", "RPG"],
	"platform": { "id": 9, "name": "N64" },
	"storage_device": { "id": 1, "name": "SSD Windows" },
	"gameplay_status": "Backlog",
	"interest_rating": 5,
	"replay_score": null,
	"score": null,
	"must_test": false,
	"finish_hours": null,
	"finish_date": null,
	"hltb_main": 69,
	"hltb_main_extra": 11,
	"hltb_full": 151,
	"coop_players": "1 Jogador",
	"coop_type": ["Um Jogador"],
	"coop_screen_type": "Tela Inteira",
	"input_recommendation": "Controle",
	"playtime_seconds": 15622,
	"notes": "Sensacional.",
	"created_at": "2026-07-27T01:08:15.573096+00:00",
	"updated_at": "2026-07-27T01:08:15.573096+00:00"
}
```

## Referência de Campos

### Identificação

| Campo         | Tipo               | Obrigatório | Descrição                                           |
| ------------- | ------------------ | ----------- | --------------------------------------------------- |
| `id`          | `string`           | ✅          | UUID curto (12 caracteres hex) gerado pelo servidor |
| `playnite_id` | `string` \| `null` | ❌          | GUID do Playnite para matching no sync              |
| `title`       | `string`           | ✅          | Nome do jogo                                        |
| `favorite`    | `boolean`          | ❌          | Favoritado (★). Default `false`                     |

### Mídia

| Campo            | Tipo     | Descrição                                                             |
| ---------------- | -------- | --------------------------------------------------------------------- |
| `cover_url`      | `string` | URL da capa. Exibida no card e modal. Placeholder `Gamepad2` se vazio |
| `background_url` | `string` | URL de fundo. Usada no header do modal de edição                      |

### Favoritos

| Campo      | Tipo      | Descrição                                                                |
| ---------- | --------- | ------------------------------------------------------------------------ |
| `favorite` | `boolean` | `true` se o jogo estiver favoritado. Alternado via botão ★ no card/linha |

### Classificação

| Campo             | Tipo                   | Valores                                                 |
| ----------------- | ---------------------- | ------------------------------------------------------- |
| `genres`          | `string[]`             | Array de nomes. Ex: `["RPG", "Aventura"]`               |
| `platform`        | `{id, name}` \| `null` | Objeto com id numérico e nome da plataforma             |
| `gameplay_status` | `string`               | `Backlog`, `Jogando`, `Finalizado`, `Abandonado`        |
| `score`           | `string` \| `null`     | Nota pessoal. Ex: `"9/10"`, `"8.5"`                     |
| `interest_rating` | `number`               | Vontade de jogar 1-5. Exibido como estrelas             |
| `replay_score`    | `number` \| `null`     | Vontade de rejogar 1-5. Preenchido apenas se finalizado |
| `must_test`       | `boolean`              | Marca "A Testar". Exibe badge âmbar                     |

### Instalação

| Campo            | Tipo                   | Descrição                                             |
| ---------------- | ---------------------- | ----------------------------------------------------- |
| `storage_device` | `{id, name}` \| `null` | Objeto com id e nome do disco. `null` = não instalado |

### Tempo de Jogo

| Campo              | Tipo               | Descrição                                                                           |
| ------------------ | ------------------ | ----------------------------------------------------------------------------------- |
| `hltb_main`        | `number`           | Horas estimadas (HowLongToBeat) — história principal. Arredondado via `ceil(x*2)/2` |
| `hltb_main_extra`  | `number`           | História + extras. Arredondado via `ceil(x*2)/2`                                    |
| `hltb_full`        | `number`           | 100% (completionist). Arredondado via `ceil(x*2)/2`                                 |
| `playtime_seconds` | `number`           | Tempo real jogado (segundos). Exibido como horas no card                            |
| `finish_hours`     | `number` \| `null` | Horas registradas ao finalizar                                                      |
| `finish_date`      | `string` \| `null` | ISO 8601                                                                            |

### Cooperativo / Multiplayer

| Campo              | Tipo       | Descrição                                                                    |
| ------------------ | ---------- | ---------------------------------------------------------------------------- |
| `coop_players`     | `string`   | `"1 Jogador"`, `"2 Jogadores"`, `"Até 4 Jogadores"`, `"Mais de 4 Jogadores"` |
| `coop_type`        | `string[]` | Array: `"Um Jogador"`, `"Sofá"`, `"Online"`, `"LAN"`                         |
| `coop_screen_type` | `string`   | `"Tela Inteira"`, `"Tela Dividida"`, `"Versus"`                              |

### Input

| Campo                  | Tipo     | Descrição                                  |
| ---------------------- | -------- | ------------------------------------------ |
| `input_recommendation` | `string` | `"Controle"`, `"Teclado/Mouse"`, `"Ambos"` |

### Anotações

| Campo   | Tipo     | Descrição          |
| ------- | -------- | ------------------ |
| `notes` | `string` | Observações livres |

### Auditoria

| Campo        | Tipo     | Descrição |
| ------------ | -------- | --------- |
| `created_at` | `string` | ISO 8601  |
| `updated_at` | `string` | ISO 8601  |

## Regras de Validação (Frontend)

| Condição                                  | Campos validados                                             |
| ----------------------------------------- | ------------------------------------------------------------ |
| **Sempre**                                | `title`, `genres` (≥1), `platform`, `interest_rating` (1-5)  |
| **Se `gameplay_status === "Finalizado"`** | `score`, `finish_hours`, `finish_date`, `replay_score` (1-5) |

## Mapeamento para API

O serviço `src/services/api.js` faz a conversão entre o formato do frontend e o esperado pela API:

| Frontend (objeto)              | API (POST/PUT body)                              |
| ------------------------------ | ------------------------------------------------ |
| `platform: { id, name }`       | `platform: "PC (Steam)"` (string)                |
| `storage_device: { id, name }` | `storage_device: "SSD Windows"` (string ou null) |
| `genres: ["RPG"]`              | `genres: ["RPG"]`                                |

## Exemplo de Uso nos Componentes

| Componente     | Campos utilizados                                                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GameCard`     | `cover_url`, `title`, `platform.name`, `hltb_main`, `genres`, `storage_device.name`, `interest_rating`, `gameplay_status`, `must_test`, `favorite`, `score`, `coop_players`, `input_recommendation`, `playtime_seconds` |
| `GameRow`      | `cover_url`, `title`, `platform.name`, `genres`, `storage_device.name`, `hltb_main`, `interest_rating`, `score`, `gameplay_status`, `must_test`, `favorite`, `playtime_seconds`                                         |
| `FilterBar`    | `platform.name`, `genres`, `gameplay_status`, `storage_device`, `interest_rating`, `coop_type`                                                                                                                          |
| `GameModal`    | Todos os campos (formulário completo)                                                                                                                                                                                   |
| `SortDropdown` | `sort` (array de `{field, dir}`)                                                                                                                                                                                        |

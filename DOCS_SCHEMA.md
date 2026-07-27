# Esquema de Dados — Game Library Dashboard

Este documento descreve a estrutura JSON de cada jogo na biblioteca, seus tipos, campos obrigatórios e a finalidade de cada um.

## Estrutura Completa

```json
{
	"id": "1",
	"playnite_id": "893d56b2-6014-411a-84bf-3b62fefae101",
	"title": "The Witcher 3: Wild Hunt",
	"img": {
		"cover": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
		"background": "https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc867u.jpg"
	},
	"genres": ["RPG", "Aventura", "Mundo Aberto"],
	"is_installed": true,
	"install_location": "SSD NVMe 1TB",
	"platform": "PC (Steam)",
	"gameplay_status": "Jogando",
	"finish_hours": null,
	"finish_date": null,
	"score": null,
	"hltb_hours": {
		"main": 51,
		"main_extra": 102,
		"full": 172
	},
	"notes": "Sensacional. Curtindo muito a história.",
	"interest_rating": 5,
	"replay_score": 3,
	"coop": {
		"coop_players": "1 (Singleplayer)",
		"coop_type": ["Um Jogador"],
		"type": "tela inteira"
	},
	"input_recommendation": "Controle",
	"must_test": false
}
```

---

## Referência de Campos

### Identificação

| Campo         | Tipo                    | Obrigatório | Descrição                                                                       |
| ------------- | ----------------------- | ----------- | ------------------------------------------------------------------------------- |
| `id`          | `string`                | ✅          | Identificador único do jogo. Gerado como `String(Date.now())` para novos jogos. |
| `playnite_id` | `string` \| `undefined` | ❌          | UUID do Playnite (para importação futura). Opcional, uso interno.               |
| `title`       | `string`                | ✅          | Nome do jogo. Deve ter ao menos 1 caractere (ignorando espaços).                |

### Mídia

| Campo            | Tipo           | Obrigatório | Descrição                                                                                 |
| ---------------- | -------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `img.cover`      | `string` (URL) | ❌          | URL da capa do jogo. Usada nos cards e no modal. Se vazia, mostra placeholder `Gamepad2`. |
| `img.background` | `string` (URL) | ❌          | URL da imagem de fundo. Usada como backdrop no header do modal de edição.                 |

### Classificação

| Campo             | Tipo               | Obrigatório | Descrição                                                                                              |
| ----------------- | ------------------ | ----------- | ------------------------------------------------------------------------------------------------------ |
| `genres`          | `string[]`         | ✅          | Array de gêneros. Deve conter ao menos 1 item. Ex: `["RPG", "Aventura"]`.                              |
| `platform`        | `string`           | ✅          | Nome da plataforma. Ex: `"PC (Steam)"`, `"Nintendo Switch (Yuzu)"`.                                    |
| `gameplay_status` | `string`           | ✅          | Status de progresso. Valores: `"Backlog"`, `"Jogando"`, `"Finalizado"`, `"Abandonado"`.                |
| `score`           | `string` \| `null` | ⚠️          | Nota pessoal. Obrigatório **apenas se** `gameplay_status === "Finalizado"`. Ex: `"9/10"`, `"8.5"`.     |
| `interest_rating` | `number`           | ✅          | Vontade de jogar (1-5). Exibido como estrelas.                                                         |
| `replay_score`    | `number` \| `null` | ⚠️          | Vontade de rejogar (1-5). Obrigatório **apenas se** finalizado. Para não-finalizados, fica vazio/nulo. |
| `must_test`       | `boolean`          | ✅          | Marca o jogo como "A Testar". Exibe badge âmbar no card e no modal.                                    |

### Instalação

| Campo              | Tipo      | Obrigatório | Descrição                                                                                                |
| ------------------ | --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `is_installed`     | `boolean` | ✅          | Indica se o jogo está instalado em disco.                                                                |
| `install_location` | `string`  | ⚠️          | Nome do disco/SSD. **Obrigatório se** `is_installed === true`. Ex: `"SSD NVMe 1TB"`, `"HD Externo 4TB"`. |

### Tempo de Jogo

| Campo                   | Tipo                          | Obrigatório | Descrição                                                                              |
| ----------------------- | ----------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `hltb_hours.main`       | `number`                      | ❌          | Horas estimadas para completar a história principal (HowLongToBeat).                   |
| `hltb_hours.main_extra` | `number`                      | ❌          | Horas para história + missões secundárias.                                             |
| `hltb_hours.full`       | `number`                      | ❌          | Horas para 100% (completionist).                                                       |
| `finish_hours`          | `number` \| `null`            | ⚠️          | Horas reais jogadas até finalizar. Obrigatório se finalizado.                          |
| `finish_date`           | `string` (ISO 8601) \| `null` | ⚠️          | Data de finalização. Obrigatório se finalizado. Formato: `"2026-05-10T18:30:00.000Z"`. |

### Cooperativo / Multiplayer

O campo `coop` é um objeto aninhado:

| Campo               | Tipo       | Obrigatório | Descrição                                                                                                                          |
| ------------------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `coop.coop_players` | `string`   | ✅          | Quantidade de jogadores. Valores: `"1 (Singleplayer)"`, `"2 Jogadores"`, `"Até 4 Jogadores"`, `"Multiplayer"`.                     |
| `coop.coop_type`    | `string[]` | ✅          | Tipo de coop. **Array** (suporta múltiplos valores simultâneos). Valores possíveis: `"Um Jogador"`, `"Sofá"`, `"Online"`, `"LAN"`. |
| `coop.type`         | `string`   | ✅          | Tipo de tela: `"tela inteira"`, `"tela dividida"`, `"versus"`.                                                                     |

### Input / Controle

| Campo                  | Tipo     | Obrigatório | Descrição                                                         |
| ---------------------- | -------- | ----------- | ----------------------------------------------------------------- |
| `input_recommendation` | `string` | ✅          | Controle recomendado: `"Controle"`, `"Teclado/Mouse"`, `"Ambos"`. |

### Anotações

| Campo   | Tipo     | Obrigatório | Descrição                                               |
| ------- | -------- | ----------- | ------------------------------------------------------- |
| `notes` | `string` | ❌          | Observações livres sobre o jogo. Sem limite de tamanho. |

---

## Regras de Validação (Frontend)

As regras abaixo são aplicadas no modal de edição (`GameModal.jsx`) antes de permitir o salvamento:

| Condição                                  | Campos Validados                                             |
| ----------------------------------------- | ------------------------------------------------------------ |
| **Sempre**                                | `title`, `genres` (≥1), `platform`, `interest_rating` (1-5)  |
| **Se `is_installed === true`**            | `install_location` (não vazio)                               |
| **Se `gameplay_status === "Finalizado"`** | `score`, `finish_hours`, `finish_date`, `replay_score` (1-5) |

Ao salvar com erros, o modal navega automaticamente para a aba com o primeiro campo inválido:

- Erros em `score`/`finish_hours`/`finish_date`/`replay_score` → aba **Finalização**
- Erro em `install_location` → aba **Instalação**
- Demais erros → aba **Geral**

---

## Exemplo de Uso dos Campos no Frontend

| Componente         | Campos Utilizados                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GameCard` (grid)  | `img.cover`, `title`, `platform`, `hltb_hours.main`, `genres`, `install_location`, `interest_rating`, `gameplay_status`, `must_test`, `score`, `coop.coop_players`, `input_recommendation`                   |
| `GameRow` (tabela) | `img.cover`, `title`, `platform`, `genres`, `install_location`, `hltb_hours.main`, `interest_rating`, `score`, `gameplay_status`, `must_test`, `input_recommendation`                                        |
| `StatsCard`        | `is_installed`, `install_location`, `must_test`, `gameplay_status`, `interest_rating`, `img.cover`, `score`, `hltb_hours.main`, `genres`, `notes`, `platform`, `replay_score`, `finish_hours`, `finish_date` |
| `FilterBar`        | `platform`, `genres`, `gameplay_status`, `is_installed`, `install_location`, `interest_rating`, `coop.coop_type`                                                                                             |
| `GameModal`        | Todos os campos (formulário completo)                                                                                                                                                                        |

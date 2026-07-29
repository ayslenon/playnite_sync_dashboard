# Game Library Dashboard

Dashboard pessoal para gerenciamento da biblioteca de jogos. Consome a API do backend FastAPI e oferece visualização em grid/tabela, filtros combináveis, ordenação multi-campo e cadastro completo de jogos.

## Stack

| Camada      | Tecnologia      |
| ----------- | --------------- |
| Framework   | React 19        |
| Build       | Vite 8          |
| Estilização | Tailwind CSS v4 |
| Ícones      | Lucide React    |
| Linter      | oxlint          |

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- Backend FastAPI rodando em `http://localhost:8000`

## Setup rápido

```bash
cd dashboard
npm install
npm run dev          # http://localhost:5173
```

### Scripts

| Comando           | Descrição                           |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento com HMR |
| `npm run build`   | Compila produção em `dist/`         |
| `npm run preview` | Serve build de produção localmente  |
| `npm run lint`    | Executa oxlint em todos os JSX      |

---

## Arquitetura

### Hierarquia de componentes

```
App
├── ErrorBoundary              ← captura crashes React
│   └── ToastProvider           ← contexto de notificações
│       └── Library             ← página principal (toda lógica)
│           ├── Header          ← título, contagem, view toggle, ordenação, ações
│           ├── QuickFilters    ← cards de atalho (HDs, Testar, Favoritos, Input...)
│           ├── FilterBar       ← sidebar (desktop) / accordion (mobile)
│           ├── GameCard[]      ← grid view
│           │   └── GameRow[]   ← table view
│           ├── GameModal       ← formulário de cadastro/edição
│           └── Toast           ← notificações (via contexto)
```

### Fluxo de dados

```
API (FastAPI :8000)
    │ fetchGames() / loadAll()
    ▼
Library.state.games (array completo em memória)
    │ useMemo → filteredGames  (filtros combinados)
    │ useMemo → sortedGames    (multi-campo)
    │ useMemo → displayedGames (fatia paginada)
    ▼
GameCard[] / GameRow[] (renderização)
```

- **Todo dataset é carregado na memória** ao iniciar (prefetch em chunks de 120)
- **Filtros e ordenação são 100% client-side** — sem chamadas à API após o load inicial
- **Mutações** (criar/editar/excluir) disparam reload silencioso do dataset

### Gerenciamento de estado

- **Sem biblioteca externa** (Redux/Zustand/etc.) — estado centralizado em `Library`
- **Context API** apenas para `ToastProvider`
- **`GameModal`** gerencia estado próprio do formulário (`formData`, `errors`, `confirm`)
- **Filtros/Sort** sobem para `Library` via `filters` state → passados como props para `FilterBar` e `SortDropdown`

---

## Funcionalidades

### Visualização

- Alternância entre **grid** (cards com capa) e **tabela** (linhas com dados completos)
- Força grid automaticamente em telas < 640px
- **Scroll infinito** com IntersectionObserver + botão "Carregar mais" como fallback
- Indicador de progresso durante prefetch inicial

### Filtros

**Filtros rápidos** (cards no header):

- **HDs** — toggle do popup de discos
- **A Testar** — jogos com `must_test = true`
- **Favoritos** — jogos favoritados (★)
- **Input** — ciclo 3 estados: `all → Controle → Teclado/Mouse → all`
- **Foco no Backlog** — Backlog + interesse >= 4 (lg+)
- **Dados Faltantes** — sem capa ou sem gênero (lg+)

**Filtros avançados** (sidebar/accordion):

- Busca textual por nome
- Status (multi-select): Backlog, Jogando, Finalizado, Abandonado
- Plataforma (multi-select)
- Interesse mínimo/máximo (estrelas 1-5)
- Tipo de coop (dropdown)
- Gêneros (nuvem de tags, multi-select)

### Ordenação

- Múltiplos critérios com prioridade (reordenável)
- Direção ASC/DESC por campo
- 11 campos ordenáveis

### Cadastro/Edição (GameModal)

- **3-4 abas**: Geral, Instalação, Multiplayer, Finalização (aparece só se status = Finalizado)
- Validação com feedback visual e navegação para aba com erro
- Confirmação em 2 etapas para salvar/descartar/excluir
- Seletor de HD (existente ou customizado)
- Busca HLTB integrada (preenche horas estimadas)
- Suporte a múltiplos tipos de coop simultâneos (Sofá + Online)

### UX

- Header sticky com ações sempre visíveis
- Toast de notificações (success/error/info) com auto-dismiss 4s
- Tema escuro consistente (`#0c0a0f`)
- Responsivo: 320px a 4K
- Lazy loading de imagens

---

## Estrutura do projeto

```
dashboard/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.jsx   ← captura erros React (classe c/ componentDidCatch)
│   │   ├── FilterBar.jsx       ← sidebar/accordion de filtros avançados
│   │   ├── GameCard.jsx        ← card da visualização em grid
│   │   ├── GameModal.jsx       ← modal de criação/edição (822 linhas)
│   │   ├── GameRow.jsx         ← linha da visualização em tabela
│   │   ├── SortDropdown.jsx    ← popover de ordenação multi-campo
│   │   └── Toast.jsx           ← ToastProvider + useToast hook
│   ├── pages/
│   │   └── Library.jsx         ← página principal (toda lógica de estado)
│   ├── services/
│   │   └── api.js              ← camada HTTP (fetch, timeout, transform)
│   ├── App.jsx                 ← entry point (component tree)
│   ├── main.jsx                ← renderização React
│   └── index.css               ← Tailwind + estilos globais (scrollbar, animações)
├── index.html
├── package.json
├── vite.config.js
├── DOCS_SCHEMA.md              ← documentação do formato de dados
└── README.md                   ← este arquivo
```

---

## API (camada de serviços)

`src/services/api.js` encapsula toda comunicação com o backend:

| Função                 | Descrição                  |
| ---------------------- | -------------------------- |
| `fetchGames(params)`   | Lista paginada com filtros |
| `fetchGame(id)`        | Detalhe                    |
| `createGame(game)`     | Criar                      |
| `updateGame(id, game)` | Atualizar                  |
| `deleteGame(id)`       | Remover                    |
| `fetchGenres()`        | Catálogo de gêneros        |
| `fetchPlatforms()`     | Catálogo de plataformas    |
| `searchHltb(title)`    | Busca metadados HLTB       |
| `exportXlsx()`         | Download planilha .xlsx    |

**Padrões:**

- Timeout de 15s via AbortController
- `toApi()` / `fromApi()` — transformam entre formato do frontend (objects aninhados) e da API (strings planas)
- `getBaseUrl()` — URL dinâmica baseada em `window.location.hostname` (funciona em LAN)
- `absUrl()` — converte URLs relativas de covers para absolutas

---

## Desenvolvimento

### Convenções

- Todo texto de UI em **português**
- Ícones via `lucide-react` (exceto GameRow que usa emoji para input — inconsistência conhecida)
- `useMemo` para filtros, ordenação e contagens
- `useCallback` para funções passadas como props
- `useRef` para IntersectionObserver e detecção de clique externo
- Props lifting: `Library` gerencia estado de filtros/sort, `FilterBar` e `SortDropdown` recebem como props controladas

### Problemas conhecidos

- `GameModal` tem 822 linhas — ideal quebrar em subcomponentes (abas)
- `recharts` é dependência morta no `package.json` (nunca importada)
- `batchCreateGames` e `fetchStorageDevices` em `api.js` não são usados
- Lógica de `activeFiltersCount` duplicada em `Library.jsx` e `FilterBar.jsx`

---

## Changelog

### v1.2.1

- `api.js`: `getBaseUrl()` dinâmico via `window.location.hostname`, `absUrl()` para capas
- Input filter: ícone alterna entre Gamepad2 e Keyboard
- `formatPlaytime` simplificado (removeu case special < 10h)
- Playtime badge e HLTB usam `> 0` em vez de truthy check
- HLTB search não sobrescreve `cover_url`
- SortDropdown badge `({n})` oculto em mobile

### v1.2.0

- Card "Favoritos", toggle favorite ★ em cards e linhas
- Ciclo de input: 3 estados com pin
- Badge de ordenação oculta em mobile

### v1.1.1

- ErrorBoundary, ToastProvider, fetch resiliente, busca HLTB, StrictMode removido

### v1.0.0

- Versão inicial: grid/tabela, filtros, ordenação, CRUD completo

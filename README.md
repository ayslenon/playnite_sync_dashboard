# Game Library Dashboard v1.1.1

Dashboard pessoal de gerenciamento de biblioteca de jogos com visualização em grid/tabela, filtros combináveis, ordenação multi-campo e cadastro completo de jogos.

## Tecnologias

- **React 19** — UI declarativa com hooks
- **Vite 8** — Build tool rápida com HMR
- **Tailwind CSS v4** — Estilização utilitária com CSS nativo (`@import "tailwindcss"`)
- **Lucide React** — Ícones leves e consistentes
- **Recharts** — (disponível para futuros gráficos)
- **oxlint** — Linter rápido (substituto do ESLint)

## Pré-requisitos

- Node.js >= 18
- npm >= 9

## Instalação

```bash
cd dashboard
npm install
```

## Scripts

| Comando           | Descrição                                  |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Inicia servidor de desenvolvimento com HMR |
| `npm run build`   | Compila para produção em `dist/`           |
| `npm run preview` | Serve localmente o build de produção       |
| `npm run lint`    | Executa oxlint em todos os arquivos JSX    |

## Estrutura do Projeto

```
dashboard/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.jsx  # Captura de crashes React com fallback
│   │   ├── FilterBar.jsx      # Sidebar/dropdown de filtros avançados
│   │   ├── GameCard.jsx       # Card para visualização em grid
│   │   ├── GameModal.jsx      # Modal de adicionar/editar jogo (3 abas)
│   │   ├── GameRow.jsx        # Linha para visualização em tabela
│   │   ├── SortDropdown.jsx   # Popover de ordenação multi-campo no header
│   │   └── Toast.jsx          # ToastProvider + useToast hook
│   ├── pages/
│   │   └── Library.jsx        # Página principal com toda a lógica
│   ├── services/
│   │   └── api.js             # Camada de comunicação com o backend FastAPI
│   ├── App.jsx                # Entry point
│   ├── main.jsx               # Renderização React
│   └── index.css              # Import do Tailwind + estilos globais
├── index.html
├── package.json
├── vite.config.js
├── DOCS_SCHEMA.md             # Documentação do formato de dados
└── README.md
```

## Funcionalidades

### Visualização

- Alternância entre **grid** (cards com capa) e **tabela** (linhas com dados completos)
- Força automaticamente grid em telas muito pequenas (< 640px)
- **Scroll infinito** com IntersectionObserver + botão "Carregar mais" como fallback

### Filtros

- **Busca textual** por nome do jogo — aplicada em tempo real (client-side)
- **Filtros avançados** em sidebar (desktop) ou dropdown (mobile):
  - HD/SSD: Filtro por disco de armazenamento com popup de checkboxes
  - Plataforma: Tags clicáveis com múltipla seleção
  - Status de Gameplay: Tags clicáveis (Backlog, Jogando, Finalizado, Abandonado)
  - Vontade de Jogar: Range mínimo e máximo (estrelas 1-5)
  - Multiplayer/Coop: Seletor único
  - Gêneros: Tags clicáveis com múltipla seleção
- **Filtros rápidos** em cards abaixo do header (ícones com badges numéricos e descrição):
  - Instalados, Jogos a Testar, Foco no Backlog, Dados Faltantes
- Nenhuma chamada à API é feita para filtrar — tudo client-side sobre o dataset completo

### Ordenação

- **SortDropdown** no header com popover de ordenação multi-campo
- Adicionar múltiplos critérios com direção (ASC/DESC) e reordenar prioridade
- Scroll automático para o topo ao mudar ordenação

### Cadastro (Modal)

- **3-4 abas**: Geral, Instalação, Multiplayer, Finalização (aparece só quando status = Finalizado)
- Validação de campos obrigatórios com feedback visual e navegação automática para a aba com erro
- Confirmação ao salvar/descartar alterações
- Seletor de HD com opção de escolher existente ou personalizado
- Botão "Excluir Jogo" com confirmação
- Inputs HLTB + Tempo Jogado lado a lado
- Suporte a múltiplos tipos de coop (Sofá + Online simultaneamente)
- Botão de busca automática de metadados (placeholder para integração futura)

### Carregamento

- **Prefetch em background**: busca chunks de 120 jogos sequencialmente até ter o dataset completo
- Falha em chunks isoladas não interrompe o prefetch (até 3 falhas consecutivas toleradas)
- Indicador de progresso no header ("Carregando X de Y jogos...")
- Loader centralizado na área da grid (não esconde header/filtros)

### Toast & Feedback

- **ToastProvider**: sistema de notificações não-bloqueante no canto superior direito
- Toasts com auto-dismiss (3.5s), variantes success/error/info, animação slide-in
- **Ações imediatas**: ao salvar/excluir jogo, modal fecha na hora, toast aparece e reload ocorre em background sem flash na grid
- **Export XLSX** com toast de sucesso/erro

### Cache

- Imagens com `loading="lazy"` nativo do browser
- Backend configurado com Cache-Control (no-cache para dados, 1h para catálogos, 1 ano para covers)

## Dados

O dashboard carrega dados do backend FastAPI (`http://localhost:8000`). Sem fallback mock — se o servidor estiver offline, exibe mensagem de erro com botão "Tentar novamente". O formato completo dos dados está documentado em `DOCS_SCHEMA.md`.

## Pontos Fortes

- **Zero dependências pesadas**: sem Redux, sem router, sem bibliotecas de formulário — tudo com React puro
- **Tema escuro consistente**: paleta `#0c0a0f` com detalhes verdes, âmbar e rosa
- **Responsivo**: funciona de 320px a 4K, com breakpoints inteligentes
- **Performance**: `useMemo` para filtros e ordenação client-side, lazy loading de imagens, prefetch em background
- **UX refinada**: header sticky com ações sempre visíveis, scroll infinito, botão de load more fallback, modais de confirmação

## Melhorias Futuras

- [x] **Exportar planilha XLSX**: endpoint no backend + botão de download
- [x] **Error Boundary**: componente que captura crashes e exibe fallback com "Tentar novamente"
- [x] **Fetch resiliente**: timeout de 15s, tratamento de NetworkError, prefetch tolerante a falhas
- [x] **Busca HLTB**: botão no modal preenche automaticamente horas estimadas e capa
- [ ] **Sincronização Playnite**: bidirecional entre servidor e Playnite
- [ ] **Busca IGDB/RAWG**: metadados adicionais (capa, background, gêneros)
- [ ] **Autenticação**: API key simples para acesso remoto
- [ ] **Gráficos e estatísticas**: dashboard com Recharts mostrando distribuição de gêneros, plataformas, horas totais
- [ ] **Testes**: adicionar vitest para testes unitários nos filtros e componentes
- [ ] **Virtualização**: react-window para listas muito grandes (+1000 jogos)

# Game Library Dashboard

Dashboard pessoal de gerenciamento de biblioteca de jogos com visualização em grid/tabela, filtros combináveis, estatísticas rápidas e cadastro completo de jogos.

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
│   │   ├── FilterBar.jsx      # Sidebar/dropdown de filtros avançados
│   │   ├── GameCard.jsx       # Card para visualização em grid
│   │   ├── GameModal.jsx      # Modal de adicionar/editar jogo (3 abas)
│   │   ├── GameRow.jsx        # Linha para visualização em tabela
│   │   └── StatsCard.jsx      # Cartões de estatísticas com filtros rápidos
│   ├── data/
│   │   └── mockGames.js       # Dados mockados (8 jogos de exemplo)
│   ├── pages/
│   │   └── Library.jsx        # Página principal com toda a lógica
│   ├── App.jsx                # Entry point
│   ├── main.jsx               # Renderização React
│   └── index.css              # Import do Tailwind + estilos globais
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Funcionalidades

### Visualização

- Alternância entre **grid** (cards com capa) e **tabela** (linhas com dados completos)
- Força automaticamente grid em telas muito pequenas (< 640px)
- Tabela com scroll horizontal em janelas estreitas

### Filtros

- **Busca textual** por nome do jogo
- **Status de instalação**: Todos / Instalados / Não Instalados
- **HD/SSD**: Filtro rápido por disco de armazenamento (com popup de seleção)
- **Plataforma**: Tags clicáveis com suporte a múltipla seleção
- **Status de Gameplay**: Tags clicáveis (Backlog, Jogando, Finalizado, Abandonado)
- **Vontade de Jogar**: Range mínimo e máximo (estrelas 1-5)
- **Multiplayer/Coop**: Seletor único (Todos, Um Jogador, Sofá, Online, LAN)
- **Gêneros**: Tags clicáveis com múltipla seleção
- **Quick Filters**: Instalados (por HD), Jogos a Testar, Foco no Backlog, Dados Faltantes
- Contador de filtros ativos com indicador visual

### Cadastro (Modal)

- **4 abas**: Geral, Instalação, Multiplayer, Finalização
- Validação de campos obrigatórios com feedback visual
- Confirmação ao salvar/descartar alterações
- Seletor de HD com opção de escolher existente ou personalizado
- Botão "Buscar Automaticamente" (placeholder para integração futura com metadados)
- Suporte a múltiplos tipos de coop (Sofá + Online simultaneamente)

### Estatísticas Rápidas

- 4 cartões clicáveis que atuam como filtros rápidos
- Badge numérico em cada cartão
- Destaque visual quando o filtro está ativo

## Dados

Atualmente os dados são carregados de um arquivo mock (`src/data/mockGames.js`) com 8 jogos de exemplo. A estrutura completa dos dados está documentada em `DOCS_SCHEMA.md`.

## Pontos Fortes

- **Zero dependências pesadas**: sem Redux, sem router, sem bibliotecas de formulário — tudo com React puro
- **Tema escuro consistente**: paleta `#0c0a0f` com detalhes verdes, âmbar e rosa
- **Responsivo**: funciona de 320px a 4K, com breakpoints inteligentes
- **Performance**: `useMemo` para filtros, lazy loading de imagens, sem re-renders desnecessários
- **UX refinada**: modais de confirmação, auto-switch de grid em telas pequenas, validação com auto-navegação para aba com erro

## Melhorias Futuras

- [ ] **Backend (FastAPI + SQLite)**: persistência real dos dados
- [ ] **Busca automática de metadados**: integração com IGDB, RAWG, SteamGridDB e HowLongToBeat
- [ ] **Autenticação**: login para uso multiusuário
- [ ] **Gráficos e estatísticas**: dashboard com Recharts mostrando distribuição de gêneros, plataformas, horas totais
- [ ] **Testes**: adicionar vitest para testes unitários nos filtros e componentes
- [ ] **Virtualização**: react-window para listas muito grandes (+1000 jogos)

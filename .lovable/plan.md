
## Plano de Grande Atualização: DevSeekr Premium Platform

### Visão Geral

Este plano transforma a aplicação DevSeekr numa plataforma premium com:
1. **Novo Layout** com Sidebar + Header
2. **Perfil Estilo RPG** com Nível e Classe
3. **Gestão de Projetos** melhorada com Metodologia

---

## FASE 1: Estrutura de Layout (Sidebar + Header)

### 1.1 Criar Componente `Layout.tsx`

Criar um componente wrapper que envolve todas as páginas autenticadas:

**Estrutura Visual:**
```text
┌──────────────────────────────────────────────────────┐
│ HEADER (Search, Notificações, Avatar)                │
├─────────┬────────────────────────────────────────────┤
│         │                                            │
│ SIDEBAR │         CONTEÚDO PRINCIPAL                 │
│         │         (bg-gray-50 / dark:bg-muted)       │
│ • Logo  │                                            │
│ • Dash  │                                            │
│ • Proj  │                                            │
│ • Msgs  │                                            │
│ • Amgs  │                                            │
│ • Perfil│                                            │
│         │                                            │
└─────────┴────────────────────────────────────────────┘
```

**Ficheiros a criar/modificar:**
- `src/components/layout/AppLayout.tsx` (NOVO) - Layout principal com Sidebar
- `src/components/layout/AppSidebar.tsx` (NOVO) - Sidebar de navegação
- `src/components/layout/AppHeader.tsx` (NOVO) - Header simplificado
- `src/App.tsx` - Envolver rotas autenticadas no Layout

### 1.2 Componentes da Sidebar

**AppSidebar.tsx:**
- Logo Devseekr no topo
- Links de navegação:
  - Dashboard (`/dashboard`)
  - Meus Projetos (`/projects`)
  - Mensagens (`/messages`)
  - Amigos (`/friends`)
  - Perfil (`/profile/:id`)
- Badge PRO para utilizadores premium
- Link ativo com destaque visual (bg-primary/10)
- Collapsível em mobile

**AppHeader.tsx:**
- Barra de pesquisa global
- NotificationBell
- Avatar do utilizador com dropdown
- ThemeToggle

---

## FASE 2: Base de Dados - Campos RPG no Perfil

### 2.1 Alterações à Tabela `profiles`

**Novos Campos:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class TEXT;
```

**Opções de Level:**
- Beginner (default)
- Junior
- Mid
- Senior

**Opções de Class:**
- Programmer
- Artist
- Sound Designer
- Game Designer
- Producer
- Writer
- All-Rounder

### 2.2 Campos Existentes (já implementados)

Os campos de Skills, Géneros Favoritos, Bio e Links Sociais já existem:
- `user_roles` - Skills/Roles
- `user_game_genres_liked/disliked` - Géneros favoritos
- `profiles.bio` - Biografia
- `user_social_links` - Portfolio/GitHub/Itch.io

---

## FASE 3: Base de Dados - Metodologia nos Projetos

### 3.1 Alterações à Tabela `projects`

**Novo Campo:**
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS methodology TEXT DEFAULT 'Casual';
```

**Opções de Metodologia:**
- Agile
- Scrum
- Kanban
- Waterfall
- Casual (default)

---

## FASE 4: Onboarding Estilo RPG

### 4.1 Redesign do Formulário de Onboarding

**Ficheiro:** `src/pages/Onboarding.tsx`

**Estrutura em Steps:**
1. **Step 1: Informação Básica**
   - Username, Nome Completo, País, Bio

2. **Step 2: Classe & Nível** (NOVO)
   - Selector visual de "Classe" com ícones
   - Selector de "Nível de Experiência"

3. **Step 3: Skills & Roles**
   - Tags selecionáveis (existente)

4. **Step 4: Preferências de Jogos**
   - Géneros gostados/não gostados
   - Estéticas preferidas
   - Jogos favoritos

5. **Step 5: Links Sociais**
   - Portfolio, GitHub, Itch.io, Twitter

**Design:**
- Cards limpos com `rounded-2xl`
- Progress bar no topo
- Animações de transição entre steps
- Ícones ilustrativos para cada classe

---

## FASE 5: Sistema de Gestão de Projetos

### 5.1 Página "Meus Projetos" (`/projects`)

**Ficheiro:** `src/pages/MyProjects.tsx` (NOVO)

**Layout:**
```text
┌─────────────────────────────────────────────┐
│  Meus Projetos              [+ Novo Projeto]│
├─────────────────────────────────────────────┤
│  📂 Em Andamento (3)                        │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │Card 1│ │Card 2│ │Card 3│                 │
│  └──────┘ └──────┘ └──────┘                 │
├─────────────────────────────────────────────┤
│  📁 Histórico (2)                           │
│  ┌──────┐ ┌──────┐                          │
│  │Card 4│ │Card 5│                          │
│  └──────┘ └──────┘                          │
└─────────────────────────────────────────────┘
```

**Features:**
- Secção "Em Andamento" (status != 'concluido')
- Secção "Histórico" (status == 'concluido')
- Cards com imagem, título, género, metodologia
- Hover effects

### 5.2 Criar Projeto (`/projects/new`)

**Ficheiro:** `src/pages/NewProject.tsx` (atualizar)

**Novos Campos:**
- Dropdown "Metodologia" com opções:
  - Agile
  - Scrum
  - Kanban
  - Waterfall
  - Casual

**Design Melhorado:**
- Layout em cards
- Preview em tempo real
- Upload drag & drop

### 5.3 Detalhes do Projeto (`/projects/:id`)

**Ficheiro:** `src/pages/Project.tsx` (atualizar)

**Layout Hero:**
```text
┌─────────────────────────────────────────────┐
│ ████████████████████████████████████████████│
│ ████████ IMAGEM DE CAPA FULL WIDTH █████████│
│ ████████████████████████████████████████████│
│                                             │
│    TÍTULO DO PROJETO                        │
│    [RPG] [Scrum]         [Editar] [Concluir]│
└─────────────────────────────────────────────┘
┌──────────────┬───────────────┐
│   EQUIPA     │  COMUNICAÇÃO  │
│              │               │
│  👤 Owner    │  💬 Chat      │
│  👤 Member   │  🎤 Voz       │
│              │               │
└──────────────┴───────────────┘
```

**Features:**
- Imagem de capa full-width com overlay
- Badges de Género e Metodologia
- Botões "Editar" e "Concluir Projeto" (apenas owner)
- Grid com Equipa e Comunicação
- Botão "Concluir" muda status para 'concluido'

---

## FASE 6: Atualização de Rotas

### 6.1 Novas Rotas

**Adicionar ao `App.tsx`:**
```
/projects - Página "Meus Projetos"
```

### 6.2 Rotas com Layout

**Rotas que usam o novo Layout:**
- `/dashboard`
- `/projects`
- `/projects/new`
- `/projects/:id`
- `/messages`
- `/friends`
- `/profile/:id`
- `/settings`
- `/explore-projects`

**Rotas SEM Layout (páginas standalone):**
- `/` (Landing Page)
- `/auth`
- `/onboarding`
- `/pricing`
- `/checkout`
- `/payment-success`
- `/payment-failed`

---

## RESUMO DE FICHEIROS

| Operação | Ficheiro | Descrição |
|----------|----------|-----------|
| CRIAR | `src/components/layout/AppLayout.tsx` | Layout wrapper com Sidebar + Header |
| CRIAR | `src/components/layout/AppSidebar.tsx` | Sidebar de navegação |
| CRIAR | `src/components/layout/AppHeader.tsx` | Header simplificado |
| CRIAR | `src/pages/MyProjects.tsx` | Página "Meus Projetos" |
| MODIFICAR | `src/App.tsx` | Integrar Layout nas rotas |
| MODIFICAR | `src/pages/Onboarding.tsx` | Adicionar campos Level/Class, design steps |
| MODIFICAR | `src/pages/NewProject.tsx` | Adicionar dropdown Metodologia |
| MODIFICAR | `src/pages/Project.tsx` | Hero design, badges, botões |
| MODIFICAR | `src/pages/Dashboard.tsx` | Remover Header (agora no Layout) |
| MODIFICAR | Todas as páginas autenticadas | Remover Header individual |
| MIGRATION | SQL | Adicionar colunas level, class, methodology |

---

## Estilo Visual Premium

**Princípios aplicados em todo o projeto:**
- `rounded-2xl` ou `rounded-3xl` em cards
- `shadow-sm` a `shadow-md` para elevação suave
- Gradientes subtis nos fundos (`bg-gradient-to-br from-background via-muted/30`)
- Tipografia moderna com hierarquia clara
- Hover effects com transições suaves
- Cores: primary (laranja), secondary (azul), background (branco/cinza)

---

## Ordem de Implementação

1. **Migration SQL** - Adicionar novos campos às tabelas
2. **Layout Components** - AppLayout, AppSidebar, AppHeader
3. **App.tsx** - Integrar Layout
4. **MyProjects.tsx** - Nova página
5. **Onboarding.tsx** - Redesign com steps e campos RPG
6. **NewProject.tsx** - Adicionar Metodologia
7. **Project.tsx** - Hero design
8. **Remover Headers** - Das páginas individuais

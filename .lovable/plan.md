
## Plano de Correção: Layout, Onboarding e MyProjects

### Visão Geral das Alterações

Este plano corrige a estrutura do layout (Sidebar/Header), redesenha o Onboarding com tradução completa para PT-PT, e melhora a página MyProjects.

---

## PARTE 1: Correção do Layout

### 1.1 AppSidebar.tsx - Redesign Completo

**Problemas Atuais:**
- Link 'Perfil' na navegação principal (duplicado)
- Falta secção fixa com avatar do utilizador no fundo
- Opções 'Ver Perfil', 'Definições' e 'Sair' dispersas

**Alterações:**

```text
┌──────────────────────┐
│ 🎮 Devseekr [PRO]    │  ← Logo + Badge
├──────────────────────┤
│ • Dashboard          │
│ • Meus Projetos      │
│ • Explorar           │  ← Navegação principal
│ • Mensagens          │     (SEM Perfil)
│ • Amigos       [2]   │
├──────────────────────┤
│ ★ Planos             │
├──────────────────────┤  ← mt-auto (fixo no fundo)
│ ┌──────────────────┐ │
│ │ 👤 Username      │ │  ← Avatar + Nome (clicável)
│ │    @handle       │ │     Abre Popover com:
│ └──────────────────┘ │     - Ver Perfil
│                      │     - Definições
│                      │     - Sair
└──────────────────────┘
```

**Detalhes Técnicos:**
- Remover item 'Perfil' do array `menuItems`
- Adicionar estado para dados do perfil (avatar_url, username)
- Criar secção `SidebarFooter` com `Popover` do shadcn/ui
- Secção do fundo com `bg-muted/50` e `hover:bg-muted`
- Popover com opções: Ver Perfil, Definições, Sair

---

### 1.2 AppHeader.tsx - Simplificação

**Problemas Atuais:**
- Avatar duplicado (já vai estar na Sidebar)
- Falta título da página atual
- Layout não usa `justify-between` corretamente

**Alterações:**

```text
┌─────────────────────────────────────────────────────────────┐
│ ☰  Dashboard                       🔍 [Pesquisar...]  🔔 🌙 │
│ ↑   ↑                                    ↑              ↑   │
│ Trigger  Título da página           Search      Notifs Theme│
└─────────────────────────────────────────────────────────────┘
```

**Detalhes Técnicos:**
- Layout: `flex items-center justify-between h-16 px-6`
- Lado Esquerdo: `SidebarTrigger` + Título dinâmico da página
- Centro: Barra de pesquisa (opcional, pode remover se preferir limpo)
- Lado Direito: `NotificationBell` + `ThemeToggle`
- **Remover**: Avatar, DropdownMenu do utilizador (movido para Sidebar)

**Mapeamento de Títulos:**
```typescript
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Meus Projetos',
  '/projects/new': 'Novo Projeto',
  '/messages': 'Mensagens',
  '/friends': 'Amigos',
  '/explore-projects': 'Explorar Projetos',
  '/settings': 'Definições',
  '/pricing': 'Planos',
};
```

---

## PARTE 2: Onboarding - Redesign UI/UX

### 2.1 Problemas Atuais

| Problema | Localização |
|----------|-------------|
| Texto em Inglês | Títulos, labels, placeholders, botões |
| Container estreito | `max-w-3xl` (muito pequeno) |
| Roles redundantes | Selector de ROLES repete a Classe |
| Sem organização visual | Secções soltas, sem Cards |

### 2.2 Alterações de Design

**Layout Expandido:**
```text
max-w-3xl → max-w-4xl (ou 5xl para mais espaço)
```

**Estrutura em Cards:**
```text
┌─────────────────────────────────────────────────────────────┐
│  🎮 Completa o teu Perfil                                   │
│  Configura o teu perfil de desenvolvedor                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📝 OS TEUS DADOS                                    │    │
│  │ ────────────────────────────────────────────────────│    │
│  │ Username*     │ Nome Completo*                      │    │
│  │ País*         │                                     │    │
│  │ Sobre ti (bio)                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🎮 A TUA CLASSE                                     │    │
│  │ ────────────────────────────────────────────────────│    │
│  │ [💻 Programmer] [🎨 Artist] [🎵 Sound] [🎮 Designer]│    │
│  │ [📋 Producer] [✍️ Writer] [🌟 All-Rounder]          │    │
│  │                                                     │    │
│  │ Nível de Experiência:                               │    │
│  │ [Beginner] [Junior] [Mid] [Senior]                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🛠️ SKILLS TÉCNICOS                                  │    │
│  │ ────────────────────────────────────────────────────│    │
│  │ [Unity] [Unreal] [Godot] [Blender] [Photoshop]...   │    │
│  │                                                     │    │
│  │ Idiomas:                                            │    │
│  │ [___________] [Adicionar]                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🎲 PREFERÊNCIAS DE JOGOS                            │    │
│  │ ────────────────────────────────────────────────────│    │
│  │ Géneros Favoritos: [Action] [RPG] [Puzzle]...       │    │
│  │ Géneros a Evitar: [Horror] [Sports]...              │    │
│  │ Estéticas: [Pixel Art] [Low Poly]...                │    │
│  │ Jogos Favoritos: [___________] [Adicionar]          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🔗 LINKS SOCIAIS                                    │    │
│  │ ────────────────────────────────────────────────────│    │
│  │ GitHub: [https://...]                               │    │
│  │ Portfolio: [https://...]                            │    │
│  │ Twitter: [https://...]                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [                   Concluir Perfil                     ]  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Traduções PT-PT

| Original (EN) | Tradução (PT-PT) |
|---------------|------------------|
| "Complete Your Profile" | "Completa o teu Perfil" |
| "Basic Information" | "Os teus Dados" |
| "Bio" | "Sobre ti" |
| "Full Name" | "Nome Completo" |
| "Username" | "Nome de Utilizador" |
| "Country" | "País" |
| "As Tuas Skills" | "Skills Técnicos" |
| "Languages" | "Idiomas" |
| "Add a language..." | "Adicionar idioma..." |
| "Game Genres" | "Géneros de Jogos" |
| "Liked Genres" | "Géneros Favoritos" |
| "Disliked Genres" | "Géneros a Evitar" |
| "Aesthetic Preferences" | "Preferências Estéticas" |
| "Liked Aesthetics" | "Estéticas Favoritas" |
| "Disliked Aesthetics" | "Estéticas a Evitar" |
| "Favorite Games" | "Jogos Favoritos" |
| "Add a favorite game..." | "Adicionar jogo favorito..." |
| "Social Links" | "Links Sociais" |
| "Complete Profile" | "Concluir Perfil" |
| "Creating Profile..." | "A criar perfil..." |
| "Please select at least one role" | "Seleciona pelo menos um skill" |

### 2.4 Lógica: Classe vs Skills

**Alteração Principal:**
- **Classe** = Role principal (Programmer, Artist, etc.) - cartões grandes
- **Skills** = Tags técnicas complementares (Unity, Blender, C#, Photoshop)

**Remover:**
- Array `ROLES` antigo com roles genéricos
- Substituir por `SKILLS` técnicos:

```typescript
const SKILLS = [
  "Unity", "Unreal Engine", "Godot", "GameMaker",
  "Blender", "Maya", "Photoshop", "Aseprite",
  "C#", "C++", "Python", "JavaScript",
  "FMOD", "Wwise", "FL Studio", "Audacity",
  "Figma", "After Effects", "Spine", "Tiled"
];
```

---

## PARTE 3: MyProjects - Ajustes Visuais

### 3.1 Remover Banner Freemium

**Alteração:**
- Remover completamente o bloco `{plan === 'freemium' && (...)}` (linhas 138-164)
- O foco é gestão, não upselling

### 3.2 Empty State Melhorado

**Design Atual:** Bom, mas pode ser maior

**Ajustes:**
- Aumentar padding: `p-12` → `p-16`
- Ícone maior: `w-20 h-20` → `w-24 h-24`
- Título maior: `text-2xl` → `text-3xl`
- Adicionar gradiente de fundo ao card

### 3.3 ProjectCard - Mostrar Metodologia

**Alteração no componente `ProjectCard.tsx`:**

**Interface atualizada:**
```typescript
interface ProjectCardProps {
  project: {
    // ... campos existentes
    methodology?: string | null;  // ADICIONAR
  };
}
```

**Layout do card:**
```text
┌─────────────────────────────────────┐
│ [IMAGEM 16:9]                       │
│                        [Em Progresso]│
├─────────────────────────────────────┤
│ Título do Projeto                   │
│ Descrição curta do projeto...       │
│                                     │
│ [RPG]  [Scrum]                      │
│   ↑       ↑                         │
│ Género  Metodologia                 │
└─────────────────────────────────────┘
```

**Código para badges:**
```typescript
<div className="flex items-center gap-2 flex-wrap">
  <Badge className="bg-gradient-primary">
    {project.genre}
  </Badge>
  {project.methodology && (
    <Badge variant="outline" className="border-primary/20">
      {project.methodology}
    </Badge>
  )}
</div>
```

---

## RESUMO DE FICHEIROS

| Ficheiro | Alterações |
|----------|------------|
| `src/components/layout/AppSidebar.tsx` | Remover 'Perfil' do menu, adicionar secção fixa com avatar + Popover |
| `src/components/layout/AppHeader.tsx` | Remover avatar, adicionar título da página, simplificar layout |
| `src/pages/Onboarding.tsx` | Traduzir tudo PT-PT, max-w-4xl, Cards por secção, SKILLS técnicos |
| `src/pages/MyProjects.tsx` | Remover banner Freemium, melhorar empty state |
| `src/components/ProjectCard.tsx` | Adicionar badge de metodologia |

---

## Ordem de Implementação

1. **AppSidebar.tsx** - Secção de utilizador no fundo com Popover
2. **AppHeader.tsx** - Remover avatar, adicionar título dinâmico
3. **Onboarding.tsx** - Tradução completa + reorganização em Cards
4. **ProjectCard.tsx** - Badge de metodologia
5. **MyProjects.tsx** - Remover banner, melhorar empty state

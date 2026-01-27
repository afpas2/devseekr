
## Plano de Alterações Estruturais e Visuais

### Visão Geral

Este plano aborda 7 alterações críticas para transformar o DevSeekr numa plataforma visualmente mais profissional e preparada para deployment.

---

## 1. VISUAL DA SIDEBAR (AppSidebar.tsx)

### Estado Atual
A sidebar já tem alguns estilos para o item ativo (`bg-primary/10 text-primary font-medium`), mas falta impacto visual.

### Alterações Necessárias

**Melhorar o destaque do item ativo:**
```text
ANTES:
bg-primary/10 text-primary font-medium

DEPOIS:
- Adicionar barra vertical à esquerda (before:absolute before:left-0 before:h-full before:w-1 before:bg-primary before:rounded-r)
- Aumentar contraste: bg-primary/15
- Adicionar sombra suave interna: shadow-sm
```

**Melhorar efeito hover:**
```text
- hover:bg-muted → hover:bg-muted/80 hover:translate-x-0.5
- Adicionar transition-all duration-200
```

**Ficheiro:** `src/components/layout/AppSidebar.tsx`
- Linhas 154-160: Atualizar classes do `SidebarMenuButton`

---

## 2. PÁGINA DE PROJETO - HERO SECTION (Project.tsx)

### Estado Atual
A imagem está dentro de um Card com altura limitada (h-48 md:h-64) e não é imersiva.

### Alterações Necessárias

**Criar Hero Section imersiva:**
```text
┌─────────────────────────────────────────────────────────────┐
│ ████████████████████ IMAGEM FULL WIDTH █████████████████████│
│ ██████████████████████████████████████████████████████████ │
│ ████████████ OVERLAY GRADIENTE (preto → transparente) █████│
│                                                             │
│   [Status Badge]                         [Editar] [Concluir]│
│                                                             │
│   TÍTULO DO PROJETO                                         │
│   [Género Badge] [Metodologia Badge]                        │
└─────────────────────────────────────────────────────────────┘
```

**Detalhes Técnicos:**
- Remover Card wrapper da imagem
- Imagem: `w-full h-72 md:h-96 object-cover` (sem margens)
- Overlay: `absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent`
- Posicionar título e badges: `absolute bottom-6 left-6 text-white`
- Botões de ação: `absolute bottom-6 right-6`
- Adicionar `text-shadow` para legibilidade

**Ficheiro:** `src/pages/Project.tsx`
- Linhas 195-310: Restruturar completamente a secção hero

---

## 3. ONBOARDING & DEFINIÇÕES (Layout & Tradução)

### Estado Atual - Onboarding.tsx
- Container: `max-w-4xl` (já bom, pode ir a 5xl)
- A maioria dos textos já está em PT-PT
- Organização em Cards já implementada

### Alterações Necessárias para Onboarding

**Aumentar largura:**
```text
max-w-4xl → max-w-5xl
```

**Pequenos ajustes de tradução (já maioritariamente em PT-PT):**
- Verificar consistência em todas as labels

### Estado Atual - Settings.tsx
- Container: `max-w-3xl` (muito estreito)
- Algumas labels ainda em Inglês (ex: "Username", "Roles")
- Não usa Cards para agrupar secções

### Alterações Necessárias para Settings

**Aumentar largura:**
```text
max-w-3xl → max-w-5xl
```

**Traduções PT-PT necessárias:**
| Original | Tradução |
|----------|----------|
| "Username" | "Nome de Utilizador" |
| "Your Roles" | "As tuas Funções" |
| "Game Genres" | "Géneros de Jogos" |
| "Liked Genres" | "Géneros Favoritos" |
| "Disliked Genres" | "Géneros a Evitar" |
| "Aesthetic Preferences" | "Preferências Estéticas" |
| "Liked Aesthetics" | "Estética Preferida" |
| "Disliked Aesthetics" | "Estética a Evitar" |
| "Favorite Games" | "Jogos Favoritos" |
| "Social Links" | "Links Sociais" |
| "Save Changes" | "Guardar Alterações" |

**Estruturar em Cards:**
- Card 1: Avatar + Dados Básicos
- Card 2: Funções & Idiomas
- Card 3: Géneros de Jogos
- Card 4: Preferências Estéticas
- Card 5: Jogos Favoritos
- Card 6: Links Sociais

**Ficheiros:**
- `src/pages/Onboarding.tsx` - Linha 322: `max-w-4xl` → `max-w-5xl`
- `src/pages/Settings.tsx` - Linha 431: `max-w-3xl` → `max-w-5xl` + traduções + Cards

---

## 4. HEADER (AppHeader.tsx)

### Estado Atual
O header já está bem estruturado com:
- `flex items-center justify-between h-16 px-6`
- Título dinâmico da página
- Barra de pesquisa funcional
- Notificações + ThemeToggle

### Alterações Necessárias

**Melhorar estilo do título:**
```text
ANTES: text-lg font-semibold
DEPOIS: text-xl font-bold text-foreground
```

**Barra de pesquisa:**
A pesquisa é funcional (redireciona para /explore-projects com query). Pode manter-se ou esconder-se em mobile.

**Ficheiro:** `src/components/layout/AppHeader.tsx`
- Linha 55: Atualizar classes do título

---

## 5. PERFIL DE UTILIZADOR - IMAGEM DE CAPA (ProfileHeader.tsx)

### Estado Atual
Já existe um gradiente de capa no ProfileHeader:
```tsx
<div className="h-32 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 relative">
```

### Alterações Necessárias

**Suportar imagem de capa personalizada ou gradiente aleatório:**

```text
┌─────────────────────────────────────────────────────────────┐
│ ██████████████ COVER IMAGE / GRADIENT ██████████████████████│
│ █████████████████████████████████████████████████████████ │
│                                           [PRO Badge]       │
│                                                             │
│    ┌───────┐                                                │
│    │ AVATAR │                                               │
│    └───────┘                                                │
│    Nome Completo @username                                  │
│    ...                                                      │
└─────────────────────────────────────────────────────────────┘
```

**Implementação:**
- Adicionar prop `cover_url` ao ProfileHeader
- Aumentar altura: `h-32` → `h-40 md:h-48`
- Array de gradientes aleatórios para utilizadores sem imagem de capa:
```typescript
const coverGradients = [
  'from-blue-600/30 via-purple-500/20 to-pink-500/30',
  'from-green-500/30 via-teal-500/20 to-cyan-500/30',
  'from-orange-500/30 via-red-500/20 to-pink-500/30',
  'from-indigo-600/30 via-blue-500/20 to-cyan-500/30',
];
```

**Ficheiro:** `src/components/profile/ProfileHeader.tsx`
- Linhas 63-74: Atualizar secção de capa

---

## 6. INTEGRAÇÃO PAGAMENTOS (Pricing.tsx)

### Estado Atual
O botão Premium redireciona para `/checkout` (página interna).

### Alterações Necessárias

**Adicionar botão "Voltar à Dashboard":**
```tsx
<Button 
  variant="ghost" 
  onClick={() => navigate('/dashboard')} 
  className="mb-6"
>
  <ArrowLeft className="mr-2 h-4 w-4" />
  Voltar à Dashboard
</Button>
```

**Alterar ação do botão Premium:**
```tsx
// ANTES
navigate("/checkout");

// DEPOIS
window.open("https://buy.stripe.com/test_eVqbJ1csa4ch2Cv6NN2wU03", "_blank");
```

**Ficheiro:** `src/pages/Pricing.tsx`
- Linha 112-120: Alterar `handlePlanAction`
- Adicionar botão "Voltar" no topo (após Header)
- Importar ArrowLeft de lucide-react

---

## 7. PREPARAÇÃO PARA VERCEL (Deployment)

### Estado Atual
- `package.json` já tem `"build": "vite build"` ✓
- `.env` já existe com as variáveis Supabase ✓
- Não existe `vercel.json`

### Alterações Necessárias

**Criar `vercel.json` na raiz:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Documentar variáveis de ambiente (para referência do utilizador):**
As variáveis necessárias já estão no `.env`:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

**Ficheiro a criar:** `vercel.json`

---

## RESUMO DE FICHEIROS

| Ficheiro | Alteração |
|----------|-----------|
| `src/components/layout/AppSidebar.tsx` | Melhorar estilos item ativo + hover |
| `src/pages/Project.tsx` | Hero section imersiva full-width |
| `src/pages/Onboarding.tsx` | `max-w-4xl` → `max-w-5xl` |
| `src/pages/Settings.tsx` | `max-w-5xl`, traduções PT-PT, estrutura em Cards |
| `src/components/layout/AppHeader.tsx` | Título `text-xl font-bold` |
| `src/components/profile/ProfileHeader.tsx` | Capa maior + gradientes aleatórios |
| `src/pages/Pricing.tsx` | Link Stripe direto + botão Voltar |
| `vercel.json` (CRIAR) | Configuração SPA routing |

---

## ORDEM DE IMPLEMENTAÇÃO

1. **vercel.json** - Criar ficheiro de configuração
2. **AppSidebar.tsx** - Melhorar visual do menu
3. **AppHeader.tsx** - Ajustar título
4. **ProfileHeader.tsx** - Capa com gradientes
5. **Settings.tsx** - Traduções + Cards + largura
6. **Onboarding.tsx** - Aumentar largura
7. **Project.tsx** - Hero section imersiva
8. **Pricing.tsx** - Link Stripe + botão Voltar

---

## NOTAS TÉCNICAS

**Não criar:**
- `requirements.txt` (projeto React/Vite, não Python)
- Ficheiro `.env` adicional (já existe)

**Build já configurado:**
```json
"build": "vite build"  ✓
```

**Variáveis de ambiente para Vercel:**
No painel do Vercel, configurar:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

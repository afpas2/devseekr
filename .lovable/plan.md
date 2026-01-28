

## Sistema de Reviews Completo - Plano de Implementação

### Visão Geral

Este plano implementa um sistema de avaliação de equipa pós-projeto com métricas detalhadas, wizard de review, e dashboard inteligente que mostra projetos pendentes de avaliação.

---

## FASE 1: BASE DE DADOS (Supabase)

### 1.1 Remover Tabela Antiga e Criar Nova

A tabela `user_reviews` existente tem estrutura limitada. Vamos criar uma nova tabela `reviews` com estrutura completa:

**SQL Migration:**
```sql
-- Drop the old user_reviews table (backup if needed)
DROP TABLE IF EXISTS user_reviews;

-- Create new reviews table with comprehensive structure
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating_overall INTEGER NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  metrics JSONB DEFAULT '{}',
  would_work_again BOOLEAN,
  recommend BOOLEAN,
  role_played TEXT,
  commitment_level TEXT,
  comment TEXT,
  flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate reviews
  UNIQUE(project_id, reviewer_id, reviewee_id)
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create reviews for completed projects" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id 
    AND reviewer_id != reviewee_id
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id 
      AND p.status = 'concluido'
    )
  );

CREATE POLICY "Users can view reviews they wrote or received" ON reviews
  FOR SELECT USING (
    auth.uid() = reviewer_id 
    OR auth.uid() = reviewee_id
  );

CREATE POLICY "Anyone can view public review data" ON reviews
  FOR SELECT USING (true);
```

**JSONB Structures:**
```typescript
// metrics field
{
  deadlines: number;      // 1-5
  quality: number;        // 1-5
  communication: number;  // 1-5
  teamwork: number;       // 1-5
  professionalism: number;// 1-5
  problem_solving: number;// 1-5
}

// flags field (hidden from public, for moderation)
{
  toxic: boolean;
  abandoned: boolean;
  broken_rules: boolean;
}
```

---

## FASE 2: LÓGICA DE GATILHO E DASHBOARD

### 2.1 Modificar Project.tsx - Botão "Concluir Projeto"

**Alteração no `handleCompleteProject`:**
```typescript
const handleCompleteProject = async () => {
  try {
    const { error } = await supabase
      .from("projects")
      .update({ status: "concluido" })
      .eq("id", id!);

    if (error) throw error;

    toast.success("Projeto concluído! Vamos avaliar a equipa.");
    setShowCompleteDialog(false);
    
    // Redirect to review wizard
    navigate(`/projects/${id}/review`);
  } catch (error: any) {
    toast.error(error.message);
  }
};
```

### 2.2 Modificar Dashboard.tsx - Lógica de Projetos Pendentes

**Nova lógica de carregamento:**

```typescript
// Fetch reviews that current user has submitted for completed projects
const { data: submittedReviews } = await supabase
  .from("reviews")
  .select("project_id, reviewee_id")
  .eq("reviewer_id", session.user.id);

// For each completed project, check if user reviewed ALL other members
const projectsNeedingReview = completedProjects.filter(project => {
  const projectMembers = allMembers.filter(m => m.project_id === project.id && m.user_id !== session.user.id);
  const reviewedInProject = submittedReviews.filter(r => r.project_id === project.id);
  return projectMembers.length > reviewedInProject.length;
});
```

**Separação na UI:**
- **Secção "Avaliar Equipa"**: Projetos `concluido` COM reviews pendentes
- **Secção "Projetos Ativos"**: Projetos `in_progress` ou `planning`

**Novo card com botão de destaque:**
```tsx
{needsReview && (
  <Button 
    className="w-full mt-3 bg-gradient-secondary"
    onClick={() => navigate(`/projects/${project.id}/review`)}
  >
    <Star className="w-4 h-4 mr-2" />
    Avaliar Equipa
  </Button>
)}
```

---

## FASE 3: WIZARD DE REVIEW (/projects/:id/review)

### 3.1 Criar Nova Página `ProjectReview.tsx`

**Rota a adicionar no App.tsx:**
```tsx
<Route path="/projects/:id/review" element={<LayoutWrapper><ProjectReview /></LayoutWrapper>} />
```

**Estrutura do Wizard:**

```text
┌─────────────────────────────────────────────────────────────┐
│                    [Progress Bar 1/4]                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌─────────────────────────────────────────────┐         │
│     │ [IMAGEM DO PROJETO]                         │         │
│     │                                             │         │
│     │     TÍTULO DO PROJETO                       │         │
│     │     "O projeto terminou. Como correu?"      │         │
│     │                                             │         │
│     │              [ Começar ]                    │         │
│     └─────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Estados do Wizard:**
1. `intro` - Ecrã inicial com imagem do projeto
2. `reviewing` - Loop por cada membro
3. `complete` - Ecrã de confirmação

**Componentes do Formulário por Membro:**

```tsx
// Avaliação Geral (Star Rating)
<div className="space-y-2">
  <Label>Avaliação Geral</Label>
  <StarRating value={rating} onChange={setRating} />
</div>

// Métricas (Sliders 1-5)
{['Cumprimento de Prazos', 'Qualidade do Trabalho', 'Comunicação', 
  'Trabalho em Equipa', 'Profissionalismo', 'Resolução de Problemas'].map(metric => (
  <div className="space-y-2">
    <div className="flex justify-between">
      <Label>{metric}</Label>
      <span className="text-sm text-muted-foreground">{value}/5</span>
    </div>
    <Slider min={1} max={5} step={1} />
  </div>
))}

// Compatibilidade (Yes/No Buttons)
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Voltarias a trabalhar?</Label>
    <ToggleGroup type="single">
      <ToggleGroupItem value="yes">Sim</ToggleGroupItem>
      <ToggleGroupItem value="no">Não</ToggleGroupItem>
    </ToggleGroup>
  </div>
  <div>
    <Label>Recomendarias?</Label>
    <ToggleGroup type="single">
      <ToggleGroupItem value="yes">Sim</ToggleGroupItem>
      <ToggleGroupItem value="no">Não</ToggleGroupItem>
    </ToggleGroup>
  </div>
</div>

// Papel no Projeto (Dropdown)
<Select>
  <SelectItem value="Programmer">Programmer</SelectItem>
  <SelectItem value="Artist">Artist</SelectItem>
  <SelectItem value="Sound Designer">Sound Designer</SelectItem>
  ...
</Select>

// Compromisso (Select)
<Select>
  <SelectItem value="Muito Baixo">Muito Baixo</SelectItem>
  <SelectItem value="Baixo">Baixo</SelectItem>
  <SelectItem value="Médio">Médio</SelectItem>
  <SelectItem value="Alto">Alto</SelectItem>
  <SelectItem value="Muito Alto">Muito Alto</SelectItem>
</Select>

// Feedback (Textarea)
<Textarea 
  placeholder="Comentário opcional sobre a colaboração..."
  maxLength={500}
/>

// Flags (Collapsible - Hidden by default)
<Collapsible>
  <CollapsibleTrigger>
    <AlertTriangle /> Reportar Problema
  </CollapsibleTrigger>
  <CollapsibleContent>
    <Checkbox id="toxic">Comportamento tóxico</Checkbox>
    <Checkbox id="abandoned">Abandonou o projeto</Checkbox>
    <Checkbox id="broken">Quebrou acordos</Checkbox>
  </CollapsibleContent>
</Collapsible>
```

**Ecrã Final:**
```tsx
<div className="text-center py-12">
  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
  <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
  <p className="text-muted-foreground mb-6">
    As tuas avaliações foram guardadas com sucesso.
  </p>
  <Button onClick={() => navigate('/dashboard')}>
    Voltar à Dashboard
  </Button>
</div>
```

---

## FASE 4: PERFIL DO UTILIZADOR - SECÇÃO REPUTAÇÃO

### 4.1 Modificar Profile.tsx e ProfileHeader.tsx

**Calcular métricas agregadas:**
```typescript
// Fetch all reviews for this user
const { data: reviewsData } = await supabase
  .from("reviews")
  .select("*")
  .eq("reviewee_id", id);

// Calculate averages
const avgRating = reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length;

// Calculate metric averages
const avgMetrics = {
  communication: average(reviews.map(r => r.metrics?.communication)),
  teamwork: average(reviews.map(r => r.metrics?.teamwork)),
  deadlines: average(reviews.map(r => r.metrics?.deadlines)),
  // ...
};

// Calculate badges
const badges = [];
if (avgMetrics.communication >= 4.5) badges.push('Comunicador Top');
if (avgMetrics.deadlines >= 4.5) badges.push('Sempre Pontual');
if (avgMetrics.teamwork >= 4.5) badges.push('Espírito de Equipa');
```

### 4.2 Criar Componente `ProfileReputation.tsx`

**Visual:**
```text
┌─────────────────────────────────────────────────────────────┐
│ ⭐ Reputação                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ★★★★☆  4.3  (12 avaliações)                              │
│                                                             │
│   🏆 Badges:                                                │
│   [Comunicador Top] [Sempre Pontual] [Profissional]         │
│                                                             │
│   📊 Métricas:                                              │
│   Comunicação     ████████░░ 4.2                            │
│   Trabalho Equipa █████████░ 4.6                            │
│   Prazos          ███████░░░ 3.8                            │
│   Qualidade       ████████░░ 4.1                            │
│                                                             │
│   👍 85% voltariam a trabalhar                              │
│   ✅ 92% recomendam                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Nota de Privacidade:**
- Utilizador vê as suas próprias stats agregadas
- NÃO vê quem escreveu cada review individual
- `flags` são completamente invisíveis (apenas para moderação interna)

---

## FASE 5: LIMPEZA DO HEADER

### 5.1 Modificar AppHeader.tsx

**Remover completamente:**
- State `searchQuery` e `setSearchQuery`
- Handler `handleSearch`
- Bloco JSX do formulário de pesquisa

**Resultado:**
```tsx
const AppHeader = () => {
  const location = useLocation();

  const getPageTitle = () => {
    // ... existing logic
  };

  return (
    <header className="...">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-bold text-foreground">{getPageTitle()}</h1>
        </div>

        {/* Right Side - Notifications + Theme Toggle ONLY */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
```

**Nota:** A pesquisa em `ExploreProjects.tsx` mantém-se intacta (tem a sua própria implementação nos filtros).

---

## FICHEIROS A MODIFICAR/CRIAR

| Ficheiro | Operação | Descrição |
|----------|----------|-----------|
| **Migration SQL** | CREATE | Nova tabela `reviews` com estrutura completa |
| `src/pages/ProjectReview.tsx` | **CRIAR** | Página Wizard de Review |
| `src/components/review/StarRating.tsx` | **CRIAR** | Componente de estrelas clicáveis |
| `src/components/review/MetricSlider.tsx` | **CRIAR** | Slider para métricas 1-5 |
| `src/components/review/MemberReviewForm.tsx` | **CRIAR** | Formulário completo por membro |
| `src/components/profile/ProfileReputation.tsx` | **CRIAR** | Secção de reputação no perfil |
| `src/App.tsx` | MODIFICAR | Adicionar rota `/projects/:id/review` |
| `src/pages/Project.tsx` | MODIFICAR | Redirecionar ao concluir projeto |
| `src/pages/Dashboard.tsx` | MODIFICAR | Mostrar projetos pendentes de review |
| `src/pages/Profile.tsx` | MODIFICAR | Usar nova estrutura de reviews |
| `src/components/layout/AppHeader.tsx` | MODIFICAR | Remover barra de pesquisa |
| `src/components/profile/LeaveReviewDialog.tsx` | **ELIMINAR** | Código antigo |
| `src/components/profile/ProfileReviews.tsx` | **ELIMINAR** | Código antigo |

---

## ORDEM DE IMPLEMENTAÇÃO

1. **Migration SQL** - Criar nova tabela `reviews`
2. **Eliminar código antigo** - `LeaveReviewDialog.tsx`, `ProfileReviews.tsx`
3. **Criar componentes de review** - StarRating, MetricSlider, MemberReviewForm
4. **Criar ProjectReview.tsx** - Wizard completo
5. **Atualizar App.tsx** - Adicionar rota
6. **Modificar Project.tsx** - Redirecionar ao concluir
7. **Modificar Dashboard.tsx** - Lógica de projetos pendentes
8. **Criar ProfileReputation.tsx** - Secção de reputação
9. **Modificar Profile.tsx** - Integrar nova reputação
10. **Modificar AppHeader.tsx** - Remover pesquisa

---

## NOTAS TÉCNICAS

**Validação de Acesso ao Wizard:**
- Só utilizadores que são membros do projeto podem aceder
- Só projetos com status `concluido` permitem reviews
- Utilizador não pode avaliar-se a si próprio

**Cálculo de Badges:**
```typescript
const BADGE_THRESHOLDS = {
  'Comunicador Top': { metric: 'communication', min: 4.5 },
  'Sempre Pontual': { metric: 'deadlines', min: 4.5 },
  'Qualidade Premium': { metric: 'quality', min: 4.5 },
  'Espírito de Equipa': { metric: 'teamwork', min: 4.5 },
  'Profissional': { metric: 'professionalism', min: 4.5 },
  'Solucionador': { metric: 'problem_solving', min: 4.5 },
};
```

**Flags (Moderação Interna):**
- Guardados no JSONB `flags`
- Invisíveis para utilizadores
- Podem ser usados futuramente para moderar utilizadores problemáticos


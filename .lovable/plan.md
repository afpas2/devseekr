
## Plano de Implementação: Gatekeeping, Smart Matching e Correção de Bugs

### Visão Geral

Este plano implementa três grandes funcionalidades: sistema de limitação de candidaturas (stamina), algoritmo inteligente de matching com score ponderado, e correções críticas de navegação.

---

## FASE 1: GATEKEEPING E MONETIZAÇÃO (Sistema de Stamina)

### 1.1 Base de Dados - Adicionar Campos ao `profiles`

**SQL Migration:**
```sql
ALTER TABLE profiles 
ADD COLUMN applications_count INTEGER DEFAULT 0,
ADD COLUMN last_application_reset TIMESTAMPTZ DEFAULT now();
```

### 1.2 Modificar Hook `useUserPlan.ts`

**Adicionar ao return:**
```typescript
interface UseUserPlanReturn {
  // ... existing fields
  applicationsThisMonth: number;
  maxApplications: number;
  canApply: boolean;
  incrementApplicationCount: () => Promise<void>;
}
```

**Lógica de Reset Mensal:**
- Verificar se `last_application_reset` é de um mês anterior
- Se sim, resetar `applications_count` para 0 e atualizar timestamp

**Limites:**
- Freemium: 3 candidaturas/mês
- Premium: Ilimitado

### 1.3 Modificar `JoinRequestDialog.tsx`

**Antes de submeter o pedido:**
1. Verificar se utilizador pode candidatar-se (`canApply`)
2. Se não puder (Free + limite atingido):
   - Mostrar modal de upgrade com botão para `/pricing`
3. Se puder:
   - Submeter pedido
   - Incrementar contador (`incrementApplicationCount`)

**UI do Modal de Limite:**
```text
┌─────────────────────────────────────────────────┐
│ ⚠️ Limite de Candidaturas Atingido              │
├─────────────────────────────────────────────────┤
│                                                 │
│ Já usaste as tuas 3 candidaturas mensais.       │
│                                                 │
│ Com o plano Premium, tens candidaturas          │
│ ilimitadas e muitas outras vantagens!           │
│                                                 │
│ [        Fazer Upgrade para PRO        ]        │
│ [              Cancelar                ]        │
└─────────────────────────────────────────────────┘
```

### 1.4 Destaque Visual - Golden Ticket (`ProjectJoinRequests.tsx`)

**Para candidatos Premium:**
- Borda dourada: `border-2 border-yellow-500/50`
- Badge PRO: `<Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">PRO</Badge>`
- Ordenação: Premium primeiro, depois por data

**Código de ordenação:**
```typescript
const sortedRequests = requests.sort((a, b) => {
  // Premium users first
  if (a.isPremium && !b.isPremium) return -1;
  if (!a.isPremium && b.isPremium) return 1;
  // Then by date (newest first)
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});
```

---

## FASE 2: SMART MATCHING ALGORITHM

### 2.1 Criar Função de Cálculo de Score

**Ficheiro: `src/utils/matchingScore.ts`**

```typescript
interface MatchScore {
  total: number;
  breakdown: {
    skillMatch: number;      // 40%
    reputation: number;      // 30%
    reliability: number;     // 20%
    compatibility: number;   // 10%
  };
  penalties: {
    toxicFlag: boolean;
    abandonedFlag: boolean;
  };
}

function calculateMatchScore(
  user: UserProfile,
  userReviews: Review[],
  requiredSkills: string[]
): MatchScore {
  // Skill Match (40%)
  const userSkills = user.roles || [];
  const matchedSkills = requiredSkills.filter(s => userSkills.includes(s));
  const skillScore = (matchedSkills.length / requiredSkills.length) * 40;

  // Reputation (30%) - média de rating_overall
  const avgRating = userReviews.length > 0 
    ? userReviews.reduce((sum, r) => sum + r.rating_overall, 0) / userReviews.length
    : 3; // default médio
  const reputationScore = (avgRating / 5) * 30;

  // Reliability (20%) - média de deadlines + commitment
  const deadlinesAvg = avgMetric(userReviews, 'deadlines');
  const reliabilityScore = (deadlinesAvg / 5) * 20;

  // Compatibility (10%) - % would_work_again
  const wouldWorkAgainCount = userReviews.filter(r => r.would_work_again).length;
  const compatibilityScore = userReviews.length > 0
    ? (wouldWorkAgainCount / userReviews.length) * 10
    : 5;

  // Penalties
  const hasToxicFlag = userReviews.some(r => r.flags?.toxic);
  const hasAbandonedFlag = userReviews.some(r => r.flags?.abandoned);
  
  let total = skillScore + reputationScore + reliabilityScore + compatibilityScore;
  
  // Severe penalty for flags
  if (hasToxicFlag) total -= 50;
  if (hasAbandonedFlag) total -= 30;

  return {
    total: Math.max(0, total),
    breakdown: { skillMatch: skillScore, reputation: reputationScore, reliability: reliabilityScore, compatibility: compatibilityScore },
    penalties: { toxicFlag: hasToxicFlag, abandonedFlag: hasAbandonedFlag }
  };
}
```

### 2.2 Atualizar Edge Function `find-team-match`

**Modificar `supabase/functions/find-team-match/index.ts`:**
- Buscar reviews de cada candidato
- Calcular score ponderado
- Ordenar por score antes de enviar para AI
- Incluir score no resultado

### 2.3 UI de Pesquisa de Membros (ExploreProjects ou MatchDialog)

**Adicionar filtros dropdown:**
```tsx
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectItem value="recent">Mais Recentes</SelectItem>
  <SelectItem value="rating">Melhor Avaliação</SelectItem>
  <SelectItem value="experience">Mais Experientes</SelectItem>
</Select>
```

**Indicador visual nos cartões:**
```tsx
{userRating > 0 && (
  <div className="flex items-center gap-1 text-sm">
    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
    <span className="font-medium">{userRating.toFixed(1)}</span>
  </div>
)}
```

---

## FASE 3: CORREÇÃO DE BUGS E NAVEGAÇÃO

### 3.1 Fix 1: Navegação para Detalhes do Projeto (404 Error)

**Problema Identificado:**
- `ExploreProjects.tsx` linha 193: `navigate(/project/${project.id})`
- `ProfileProjects.tsx` linha 35: `navigate(/project/${project.id})`
- **Rota definida em App.tsx:** `/projects/:id` (com 's')

**Correção:**
Alterar de `/project/` para `/projects/`:

```typescript
// ExploreProjects.tsx - Linha 193
onViewDetails={() => navigate(`/projects/${project.id}`)}

// ProfileProjects.tsx - Linha 35
onClick={() => navigate(`/projects/${project.id}`)}
```

### 3.2 Fix 2: Botão "Enviar Mensagem" no Perfil

**Estado Atual (ProfileHeader.tsx linha 43):**
```typescript
const handleSendMessage = () => {
  navigate(`/messages?user=${profile.id}`);
};
```

**Problema:** A página Messages não processa o query param `user`.

**Correção - Modificar `Messages.tsx`:**
```typescript
const Messages = () => {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const userIdFromQuery = searchParams.get('user');
  
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    conversationId || userIdFromQuery || undefined
  );

  // Se vier user param, criar/abrir conversa automaticamente
  useEffect(() => {
    if (userIdFromQuery) {
      handleOpenOrCreateConversation(userIdFromQuery);
    }
  }, [userIdFromQuery]);
  
  const handleOpenOrCreateConversation = async (targetUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const [userId1, userId2] = [user.id, targetUserId].sort();
    
    // Verificar se conversa já existe
    const { data: existing } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('user1_id', userId1)
      .eq('user2_id', userId2)
      .single();
    
    if (!existing) {
      // Criar nova conversa como pending
      await supabase.from('conversations').insert({
        user1_id: userId1,
        user2_id: userId2,
        status: 'pending',
      });
    }
    
    setSelectedUserId(targetUserId);
    // Limpar o query param
    navigate('/messages', { replace: true });
  };
};
```

### 3.3 Fix 3: Botão "Convidar para Projeto" no Perfil

**Criar novo componente: `src/components/profile/InviteToProjectDialog.tsx`**

```text
┌─────────────────────────────────────────────────┐
│ 📨 Convidar para Projeto                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ Escolhe um projeto para convidar @username:     │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🎮 Projeto Alpha                            │ │
│ │    RPG • Em Progresso                       │ │
│ │                        [Convidar]           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🎮 Projeto Beta                             │ │
│ │    Puzzle • Planeamento                     │ │
│ │                        [Convidar]           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [              Fechar                         ] │
└─────────────────────────────────────────────────┘
```

**Lógica do Componente:**
1. Buscar todos os projetos onde `owner_id = currentUser.id`
2. Filtrar projetos onde o target user ainda não é membro
3. Ao clicar "Convidar":
   - Inserir em `project_invitations`
   - Criar notificação para o utilizador
   - Mostrar toast de sucesso

**Integrar no ProfileHeader.tsx:**
```tsx
const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

<Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
  <Mail className="w-4 h-4" />
  Convidar para Projeto
</Button>

<InviteToProjectDialog
  open={inviteDialogOpen}
  onOpenChange={setInviteDialogOpen}
  targetUserId={profile.id}
  targetUsername={profile.username}
/>
```

---

## RESUMO DE FICHEIROS

| Ficheiro | Operação | Descrição |
|----------|----------|-----------|
| **Migration SQL** | CREATE | Adicionar `applications_count` e `last_application_reset` a `profiles` |
| `src/hooks/useUserPlan.ts` | MODIFICAR | Adicionar lógica de contagem de candidaturas |
| `src/components/explore/JoinRequestDialog.tsx` | MODIFICAR | Verificar limite antes de candidatar |
| `src/components/project/ProjectJoinRequests.tsx` | MODIFICAR | Ordenação + visual Premium (Golden Ticket) |
| `src/utils/matchingScore.ts` | **CRIAR** | Função de cálculo de score ponderado |
| `supabase/functions/find-team-match/index.ts` | MODIFICAR | Integrar score no matching |
| `src/pages/ExploreProjects.tsx` | MODIFICAR | Fix navegação `/project/` → `/projects/` |
| `src/components/profile/ProfileProjects.tsx` | MODIFICAR | Fix navegação |
| `src/pages/Messages.tsx` | MODIFICAR | Processar query param `?user=` |
| `src/components/profile/InviteToProjectDialog.tsx` | **CRIAR** | Modal de convite para projeto |
| `src/components/profile/ProfileHeader.tsx` | MODIFICAR | Integrar InviteToProjectDialog |

---

## ORDEM DE IMPLEMENTAÇÃO

1. **Migration SQL** - Adicionar campos ao profiles
2. **Fix Navegação** - Corrigir `/project/` → `/projects/` (bug crítico)
3. **useUserPlan.ts** - Lógica de stamina
4. **JoinRequestDialog.tsx** - Verificação de limite + modal upgrade
5. **ProjectJoinRequests.tsx** - Golden Ticket para Premium
6. **InviteToProjectDialog.tsx** - Criar componente
7. **ProfileHeader.tsx** - Integrar invite dialog
8. **Messages.tsx** - Processar query param user
9. **matchingScore.ts** - Criar utility
10. **find-team-match** - Atualizar edge function

---

## DETALHES TÉCNICOS

**Reset Mensal de Candidaturas:**
```typescript
const checkAndResetMonthlyLimit = async () => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('applications_count, last_application_reset')
    .eq('id', user.id)
    .single();
    
  if (profile) {
    const lastReset = new Date(profile.last_application_reset);
    const now = new Date();
    
    // Se mudou de mês, resetar
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      await supabase
        .from('profiles')
        .update({ 
          applications_count: 0, 
          last_application_reset: now.toISOString() 
        })
        .eq('id', user.id);
      return 0;
    }
    return profile.applications_count;
  }
  return 0;
};
```

**Score Matching - Pesos:**
| Componente | Peso | Descrição |
|------------|------|-----------|
| Skill Match | 40% | Correspondência de roles/skills |
| Reputation | 30% | Média de rating_overall |
| Reliability | 20% | Média de deadlines das reviews |
| Compatibility | 10% | % would_work_again |

**Penalidades de Flags:**
- `toxic: true` → -50 pontos
- `abandoned: true` → -30 pontos


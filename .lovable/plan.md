

## Sistema de Quests e Sprints - Plano de Implementacao

### Resumo

Este plano transforma a pagina de projeto num centro de comando gamificado, adicionando um sistema de tarefas estilo Kanban com sprints e celebracoes visuais quando as tarefas sao concluidas.

---

## FASE 1: Base de Dados (Supabase)

### 1.1 Tabela `sprints`

Armazena os sprints/iteracoes de cada projeto.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador unico |
| project_id | uuid (FK -> projects) | Projeto associado |
| name | text | Nome do sprint (ex: "Sprint 1") |
| goal | text | Objetivo do sprint |
| start_date | timestamptz | Data de inicio |
| end_date | timestamptz | Data de fim |
| status | text | Estado: 'future', 'active', 'completed' |
| created_at | timestamptz | Data de criacao |

### 1.2 Tabela `tasks`

Armazena as tarefas/quests de cada projeto.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador unico |
| project_id | uuid (FK -> projects) | Projeto associado |
| sprint_id | uuid (FK -> sprints, nullable) | Sprint associado (null = backlog) |
| assignee_id | uuid (FK -> profiles, nullable) | Membro responsavel |
| title | text | Titulo da tarefa |
| description | text | Descricao detalhada |
| status | text | Estado: 'todo', 'in_progress', 'review', 'done' |
| priority | text | Prioridade: 'low', 'medium', 'high', 'critical' |
| points | integer | Pontos de esforco (default 0) |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

### 1.3 Politicas RLS (Seguranca)

Ambas as tabelas usam a mesma logica de seguranca baseada em `project_members`:

```sql
-- Funcao auxiliar para verificar se o utilizador e membro do projeto
CREATE OR REPLACE FUNCTION is_project_member(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = p_project_id AND user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND owner_id = p_user_id
  )
$$;
```

**Politicas para `sprints` e `tasks`:**
- **SELECT**: Membros do projeto podem ver
- **INSERT**: Membros do projeto podem criar
- **UPDATE**: Membros do projeto podem atualizar
- **DELETE**: Apenas owner do projeto pode eliminar

---

## FASE 2: UI do Kanban (Nova Tab "Quests")

### 2.1 Reestruturacao do Project.tsx

Adicionar sistema de Tabs para organizar o conteudo:

```text
+----------------------------------------------------------+
|  [Hero Section - Mantido como esta]                       |
+----------------------------------------------------------+
|                                                          |
|  [Sobre] [Quests] [Equipa] [Chat]    <- Tabs             |
|  ========                                                 |
|                                                          |
|  +------------------------------------------------------+ |
|  |  [Conteudo da Tab Selecionada]                       | |
|  +------------------------------------------------------+ |
|                                                          |
+----------------------------------------------------------+
```

### 2.2 Componente ProjectKanban.tsx

Quadro Kanban horizontal com 4 colunas fixas:

```text
+----------------------------------------------------------+
|  [Sprint: Sprint Atual v]        [+ Criar Quest]          |
+----------------------------------------------------------+
|                                                          |
|  Backlog (3)   Em Progresso (2)   Revisao (1)   Feito (5) |
|  +---------+   +---------+        +---------+   +---------+ |
|  | Task 1  |   | Task 4  |        | Task 6  |   | Task 7  | |
|  +---------+   +---------+        +---------+   +---------+ |
|  | Task 2  |   | Task 5  |        |         |   | Task 8  | |
|  +---------+   +---------+        |         |   +---------+ |
|  | Task 3  |   |         |        |         |   | Task 9  | |
|  +---------+   |         |        |         |   +---------+ |
|                                              |   ...       |
+----------------------------------------------------------+
```

**Tecnologia:** `@dnd-kit/core` + `@dnd-kit/sortable` para drag-and-drop

### 2.3 Componente TaskCard.tsx

Cartao individual de tarefa:

```text
+---------------------------------+
| [Prioridade Badge]   [Avatar]   |
| Titulo da Tarefa                |
| Descricao curta...              |
+---------------------------------+
```

- Badge de prioridade com cores: Verde (low), Amarelo (medium), Vermelho (high), Roxo (critical)
- Avatar do assignee com fallback para inicial
- Hover effect e cursor grab

### 2.4 Componente CreateTaskDialog.tsx

Modal para criar novas tarefas:

- Campo: Titulo (obrigatorio)
- Campo: Descricao (opcional)
- Select: Prioridade (low/medium/high/critical)
- Select: Atribuir a (lista de membros do projeto)
- Select: Sprint (opcional)
- Botao: Criar Quest

---

## FASE 3: Sprints e Gamificacao

### 3.1 Filtro de Sprints

Dropdown no topo do Kanban:
- "Sprint Atual" - Mostra tarefas do sprint ativo
- "Backlog Geral" - Mostra tarefas sem sprint
- "Todas as Quests" - Mostra todas as tarefas

### 3.2 Efeito Confetti (Celebracao)

**Dependencia:** `canvas-confetti`

**Logica:**
Quando uma tarefa e arrastada para a coluna "Feito":
1. Atualizar estado local imediatamente (optimistic update)
2. Disparar animacao de confetti
3. Enviar atualizacao ao Supabase em background
4. Reverter se houver erro

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;
  
  const newStatus = over.id as string;
  const taskId = active.id as string;
  
  // Optimistic update
  setTasks(prev => prev.map(t => 
    t.id === taskId ? { ...t, status: newStatus } : t
  ));
  
  // Confetti se moveu para "done"
  if (newStatus === 'done') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
  
  // Persist to database
  const { error } = await supabase
    .from('tasks')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', taskId);
    
  if (error) {
    // Rollback on error
    toast.error('Erro ao atualizar tarefa');
    loadTasks();
  }
};
```

---

## FICHEIROS A CRIAR/MODIFICAR

| Ficheiro | Operacao | Descricao |
|----------|----------|-----------|
| `supabase/migrations/[timestamp]_quests_sprints.sql` | CRIAR | Schema das tabelas + RLS |
| `src/integrations/supabase/types.ts` | ATUALIZAR | Tipos gerados automaticamente |
| `src/pages/Project.tsx` | MODIFICAR | Adicionar Tabs e reorganizar layout |
| `src/components/project/ProjectKanban.tsx` | CRIAR | Quadro Kanban principal |
| `src/components/project/TaskCard.tsx` | CRIAR | Cartao de tarefa draggable |
| `src/components/project/CreateTaskDialog.tsx` | CRIAR | Dialog para criar tarefas |
| `src/components/project/SprintSelector.tsx` | CRIAR | Dropdown de filtragem |
| `src/hooks/useTasks.ts` | CRIAR | Hook para gestao de tarefas |
| `package.json` | MODIFICAR | Adicionar @dnd-kit e canvas-confetti |

---

## ORDEM DE IMPLEMENTACAO

1. **Migracao SQL** - Criar tabelas `sprints` e `tasks` com RLS
2. **Instalar dependencias** - `@dnd-kit/core`, `@dnd-kit/sortable`, `canvas-confetti`
3. **Criar hook useTasks** - Gestao de estado e operacoes CRUD
4. **Criar TaskCard.tsx** - Componente de cartao de tarefa
5. **Criar CreateTaskDialog.tsx** - Modal de criacao
6. **Criar SprintSelector.tsx** - Dropdown de filtragem
7. **Criar ProjectKanban.tsx** - Quadro principal com drag-and-drop
8. **Modificar Project.tsx** - Integrar Tabs e novo layout
9. **Testar e refinar** - Validar optimistic updates e confetti

---

## DETALHES TECNICOS

### Drag and Drop com @dnd-kit

```typescript
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

### Estrutura das Colunas

```typescript
const COLUMNS = [
  { id: 'todo', title: 'Backlog', color: 'bg-slate-500/10' },
  { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-500/10' },
  { id: 'review', title: 'Revisao', color: 'bg-amber-500/10' },
  { id: 'done', title: 'Feito', color: 'bg-green-500/10' },
];
```

### Realtime Subscriptions

O quadro Kanban ira subscrever a alteracoes em tempo real para sincronizar entre membros:

```typescript
const channel = supabase
  .channel(`project-tasks-${projectId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
    () => loadTasks()
  )
  .subscribe();
```

---

## NOTAS IMPORTANTES

- **Optimistic Updates:** A UI atualiza imediatamente ao arrastar, sem esperar pelo servidor
- **Realtime Sync:** Alteracoes de outros membros aparecem automaticamente
- **RLS Security:** Apenas membros do projeto podem ver/editar tarefas
- **Funcionalidades Existentes:** Todo o codigo atual do Project.tsx sera mantido, apenas reorganizado em Tabs


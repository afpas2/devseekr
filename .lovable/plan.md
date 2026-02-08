
## Logica de Sprints e Criacao de Tarefas - Plano de Implementacao

### Analise do Estado Atual

A base do sistema ja esta implementada e funcional:
- Hook `useTasks.ts` com CRUD e real-time updates
- Dialog de criacao de tarefas (`CreateTaskDialog.tsx`)
- Componentes visuais do Kanban (colunas, cartoes, drag-and-drop)
- Animacao de confetti ao completar tarefas

O que falta adicionar para completar a experiencia:

---

## FASE 1: Gestao de Sprints

### 1.1 Criar Modal CreateSprintDialog

Novo componente para permitir a criacao de sprints.

**Ficheiro:** `src/components/project/CreateSprintDialog.tsx`

**Campos do formulario:**
- Nome (obrigatorio) - Ex: "Sprint 1", "Sprint Alpha"
- Data de Inicio (DatePicker)
- Data de Fim (DatePicker)
- Objetivo (textarea opcional) - Ex: "Implementar o sistema de combate"

**Comportamento:**
- Abre via botao "Criar Sprint" ao lado do "Criar Quest"
- Valida que data fim e posterior a data inicio
- Ao criar, o sprint fica com status "future" por defeito
- Se a data atual estiver dentro do intervalo, marca como "active"

### 1.2 Expandir SprintSelector

O dropdown atual so tem 3 opcoes estaticas. Precisa listar todos os sprints.

**Ficheiro:** `src/components/project/SprintSelector.tsx`

**Nova estrutura do dropdown:**
```
- Todas as Quests
- Backlog Geral
- [Separador]
- Sprint 1 (Ativo)      <- Sprint atual baseado nas datas
- Sprint 2 (Futuro)
- Sprint 0 (Passado)
```

**Alteracoes:**
- Mudar tipo de filtro de `'current' | 'backlog' | 'all'` para `string`
- Valores possiveis: `'all'`, `'backlog'`, ou `UUID do sprint`
- Ordenar sprints por data (ativos primeiro, depois futuros, depois passados)

### 1.3 Atualizar useTasks.ts

**Novas funcoes:**
- `createSprint()` - Para criar novos sprints
- Ajustar `getFilteredTasks()` para suportar filtragem por sprint ID especifico

**Nova logica de filtragem:**
```typescript
const getFilteredTasks = () => {
  if (sprintFilter === 'all') return tasks;
  if (sprintFilter === 'backlog') return tasks.filter(t => !t.sprint_id);
  // Se for um UUID, filtra por esse sprint
  return tasks.filter(t => t.sprint_id === sprintFilter);
};
```

---

## FASE 2: Pre-selecao no Dialog de Criacao

### 2.1 Passar Filtro Atual ao CreateTaskDialog

**Ficheiro:** `src/components/project/ProjectKanban.tsx`

Passar o `sprintFilter` atual para o dialog:
```typescript
<CreateTaskDialog
  open={showCreateDialog}
  onOpenChange={setShowCreateDialog}
  members={members}
  sprints={sprints}
  onCreateTask={createTask}
  defaultSprintId={sprintFilter !== 'all' && sprintFilter !== 'backlog' ? sprintFilter : undefined}
/>
```

### 2.2 Usar Default Sprint no Dialog

**Ficheiro:** `src/components/project/CreateTaskDialog.tsx`

Receber nova prop `defaultSprintId` e usa-la como valor inicial:
```typescript
interface CreateTaskDialogProps {
  // ... existing props
  defaultSprintId?: string;
}

// No componente:
const [sprintId, setSprintId] = useState<string>(defaultSprintId || "");
```

---

## FASE 3: Integracao no ProjectKanban

### 3.1 Adicionar Botao "Criar Sprint"

**Ficheiro:** `src/components/project/ProjectKanban.tsx`

Layout atualizado dos controlos:
```
[SprintSelector v] [Criar Sprint] [Criar Quest]
```

Estado para controlar o dialog:
```typescript
const [showCreateSprintDialog, setShowCreateSprintDialog] = useState(false);
```

### 3.2 Validar Drag-and-Drop

O codigo atual ja esta correto:
1. `handleDragEnd` atualiza UI otimisticamente via `optimisticUpdateStatus`
2. Dispara confetti quando `newStatus === 'done'`
3. Persiste no Supabase via `updateTaskStatus`
4. Faz rollback se houver erro

### 3.3 Validar TaskCard

O componente ja mostra:
- Badge de prioridade com cores (verde/amarelo/vermelho/roxo)
- Titulo da tarefa
- Avatar do assignee (quando atribuido)
- Grip icon para indicar que e arrastavel

---

## FICHEIROS A CRIAR/MODIFICAR

| Ficheiro | Operacao | Descricao |
|----------|----------|-----------|
| `src/components/project/CreateSprintDialog.tsx` | CRIAR | Modal para criar sprints |
| `src/components/project/SprintSelector.tsx` | MODIFICAR | Listar todos os sprints individuais |
| `src/hooks/useTasks.ts` | MODIFICAR | Adicionar createSprint e melhorar filtragem |
| `src/components/project/ProjectKanban.tsx` | MODIFICAR | Adicionar botao criar sprint e passar props |
| `src/components/project/CreateTaskDialog.tsx` | MODIFICAR | Aceitar defaultSprintId |

---

## ORDEM DE IMPLEMENTACAO

1. **Modificar useTasks.ts** - Adicionar `createSprint()` e novo tipo de filtro
2. **Criar CreateSprintDialog.tsx** - Modal completo com DatePickers
3. **Atualizar SprintSelector.tsx** - Listar sprints individuais
4. **Modificar CreateTaskDialog.tsx** - Aceitar `defaultSprintId`
5. **Atualizar ProjectKanban.tsx** - Integrar tudo

---

## DETALHES TECNICOS

### Estrutura do CreateSprintDialog

```typescript
interface CreateSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSprint: (data: {
    name: string;
    goal?: string;
    start_date?: string;
    end_date?: string;
  }) => Promise<boolean>;
}
```

### Logica de Status do Sprint

```typescript
const getSprintStatus = (sprint: Sprint): SprintStatus => {
  const now = new Date();
  const start = sprint.start_date ? new Date(sprint.start_date) : null;
  const end = sprint.end_date ? new Date(sprint.end_date) : null;
  
  if (end && now > end) return 'completed';
  if (start && now >= start && (!end || now <= end)) return 'active';
  return 'future';
};
```

### Ordenacao de Sprints no Selector

```typescript
const sortedSprints = [...sprints].sort((a, b) => {
  // Ativos primeiro, depois futuros, depois completos
  const statusOrder = { active: 0, future: 1, completed: 2 };
  return statusOrder[a.status] - statusOrder[b.status];
});
```

---

## RESULTADO ESPERADO

Apos implementacao:

1. **Criar Sprint** - Botao ao lado de "Criar Quest" abre modal com datas
2. **Dropdown Expandido** - Lista todos os sprints com indicacao de estado
3. **Filtragem Funcional** - Selecionar sprint mostra so as tarefas desse sprint
4. **Pre-selecao Inteligente** - Ao criar quest, o sprint do filtro atual e pre-selecionado
5. **Drag-and-Drop** - Arrastar para "Feito" dispara confetti e guarda no Supabase
6. **Cartoes Completos** - Badge de prioridade + titulo + avatar do responsavel

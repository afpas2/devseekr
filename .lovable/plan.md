

## Correcao de Tarefas Nao Aparecem no Sprint

### Problema Identificado

Encontrei o problema principal. Ha duas causas:

---

### Causa 1: defaultSprintId Nao Atualiza

No ficheiro `CreateTaskDialog.tsx`, o estado `sprintId` e inicializado com `defaultSprintId` apenas na **primeira montagem** do componente:

```typescript
// Linha 61 - Problema aqui
const [sprintId, setSprintId] = useState<string>(defaultSprintId || "no-sprint");
```

Quando o utilizador muda o filtro do Sprint e abre o dialog novamente, o React **nao atualiza** o estado porque `useState` so usa o valor inicial na primeira renderizacao.

**Solucao:** Adicionar um `useEffect` para sincronizar o estado quando `defaultSprintId` muda:

```typescript
useEffect(() => {
  setSprintId(defaultSprintId || "no-sprint");
}, [defaultSprintId]);
```

---

### Causa 2: Realtime Pode Ter Latencia

O sistema de realtime do Supabase (linhas 108-120 de useTasks.ts) esta configurado corretamente, mas pode haver uma pequena latencia. Para garantir uma experiencia mais imediata, podemos forcar um reload apos a criacao da tarefa.

**Nao e obrigatorio** porque o realtime ja esta a funcionar, mas podemos adicionar como fallback.

---

## Ficheiro a Modificar

| Ficheiro | Alteracao |
|----------|-----------|
| `src/components/project/CreateTaskDialog.tsx` | Adicionar useEffect para sincronizar defaultSprintId |

---

## Alteracoes Detalhadas

### CreateTaskDialog.tsx

**Adicionar import do useEffect:**
```typescript
import { useState, useEffect } from "react";
```

**Adicionar sincronizacao do defaultSprintId (apos linha 62):**
```typescript
// Sync sprintId when defaultSprintId changes (dialog reopens with different filter)
useEffect(() => {
  setSprintId(defaultSprintId || "no-sprint");
}, [defaultSprintId]);
```

---

## Verificacao da Logica de Filtragem

Confirmei que a logica de filtragem em `useTasks.ts` esta correta (linhas 185-190):

```typescript
const getFilteredTasks = () => {
  if (sprintFilter === 'all') return tasks;
  if (sprintFilter === 'backlog') return tasks.filter(t => !t.sprint_id);
  // Se for um UUID, filtra por esse sprint
  return tasks.filter(t => t.sprint_id === sprintFilter);
};
```

- `'all'` - Mostra todas as tarefas (correto)
- `'backlog'` - Mostra tarefas sem sprint (correto)
- UUID - Compara `sprint_id` com o filtro selecionado (correto)

---

## Verificacao do SprintSelector

O SprintSelector (linha 54) esta a passar corretamente o UUID do sprint como `value`:

```typescript
<SelectItem key={sprint.id} value={sprint.id}>
```

O `sprint.id` e o UUID, nao o nome.

---

## Resultado Esperado

Apos esta correcao:

1. Ao mudar o filtro do Sprint e clicar em "Criar Quest", o sprint correto estara pre-selecionado
2. A tarefa criada aparecera imediatamente no Kanban do sprint selecionado
3. O realtime subscription ja garante que outros membros da equipa vejam a tarefa em tempo real


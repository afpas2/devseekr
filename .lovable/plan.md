
## Correcao do Erro Select.Item Value

### Problema Identificado

O erro `A <Select.Item /> must have a value prop that is not an empty string` ocorre porque o Radix UI Select nao permite `<SelectItem value="">`. O valor vazio esta reservado para limpar a selecao.

**Localizacao do problema em `CreateTaskDialog.tsx`:**
- Linha 149: `<SelectItem value="">Ninguem</SelectItem>` (Assignee)
- Linha 168: `<SelectItem value="">Backlog (sem sprint)</SelectItem>` (Sprint)

---

### Solucao

Substituir os valores vazios por valores especiais e converter para `null` na submissao.

| Campo | Valor Atual | Novo Valor |
|-------|-------------|------------|
| Assignee | `""` | `"unassigned"` |
| Sprint | `""` | `"no-sprint"` |

---

### Alteracoes no Ficheiro

**Ficheiro:** `src/components/project/CreateTaskDialog.tsx`

#### 1. Atualizar Estados Iniciais

```typescript
// Antes
const [assigneeId, setAssigneeId] = useState<string>("");
const [sprintId, setSprintId] = useState<string>(defaultSprintId || "");

// Depois
const [assigneeId, setAssigneeId] = useState<string>("unassigned");
const [sprintId, setSprintId] = useState<string>(defaultSprintId || "no-sprint");
```

#### 2. Atualizar SelectItems

**Assignee (linha 149):**
```typescript
// Antes
<SelectItem value="">Ninguem</SelectItem>

// Depois
<SelectItem value="unassigned">Ninguem</SelectItem>
```

**Sprint (linha 168):**
```typescript
// Antes
<SelectItem value="">Backlog (sem sprint)</SelectItem>

// Depois
<SelectItem value="no-sprint">Backlog (sem sprint)</SelectItem>
```

#### 3. Atualizar handleSubmit

Converter os valores especiais para `null` antes de enviar:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!title.trim()) return;

  setLoading(true);
  const success = await onCreateTask({
    title: title.trim(),
    description: description.trim() || undefined,
    priority,
    assignee_id: assigneeId === "unassigned" ? null : assigneeId,
    sprint_id: sprintId === "no-sprint" ? null : sprintId
  });
  // ... resto igual
};
```

#### 4. Atualizar Reset do Formulario

Apos sucesso, resetar para os valores especiais:

```typescript
if (success) {
  setTitle("");
  setDescription("");
  setPriority("medium");
  setAssigneeId("unassigned");
  setSprintId("no-sprint");
  onOpenChange(false);
}
```

---

### Resultado

- O modal de criar tarefa abre sem erros
- A opcao "Ninguem" funciona corretamente para o campo Assignee
- A opcao "Backlog (sem sprint)" funciona corretamente para o campo Sprint
- Os valores sao corretamente convertidos para `null` na base de dados

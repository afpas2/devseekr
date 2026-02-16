

## Plano: Perfil Multi-Skill e AI Draft Mode

---

### FASE 1: Perfil Mais Flexivel

#### 1.1 Campo "Classe" - Multi-Select (Onboarding + Settings)

**Problema atual:** No Onboarding, o campo "A tua Classe" so permite selecionar UMA classe (`playerClass` e uma string unica). Na base de dados, o campo `class` na tabela `profiles` e `text` (single value).

**Solucao:**
- **Onboarding.tsx:** Mudar a logica de selecao de classe de single-select para multi-select (toggle). Trocar `formData.playerClass` (string) por `selectedClasses` (string[]). Visualmente, permitir clicar em multiplas classes (ficam todas highlighted). Na submissao, guardar como array concatenado ou separado por virgula no campo `class`.
- **Settings.tsx:** Aplicar a mesma logica multi-select. Ao carregar dados, fazer parse do valor guardado.
- **Base de dados:** O campo `class` na tabela `profiles` e `text`. Vou guardar como string separada por virgulas (ex: `"Programmer,Game Designer"`), evitando migracoes de schema. O parse e feito no frontend.

#### 1.2 Skills Tecnicas - Free Text Tag Input com Auto-Suggest

**Problema atual:** Skills sao uma lista predefinida de 20 opcoes (badges clickaveis). Limita utilizadores que usam ferramentas nao listadas.

**Solucao:**
- Criar um componente `SkillTagInput` reutilizavel:
  - Um campo de texto onde o utilizador escreve
  - A medida que escreve, aparece um dropdown com sugestoes filtradas (das skills existentes na BD + lista base predefinida)
  - Ao carregar Enter ou clicar numa sugestao, cria a tag
  - As tags aparecem abaixo como badges com botao X para remover
  - A pesquisa de sugestoes faz: buscar todos os `user_roles` distintos da BD que comecem com o texto digitado (query `ilike`), para evitar duplicatas e sugerir formatos existentes
- **Onboarding.tsx:** Substituir a grid de badges por este componente
- **Settings.tsx:** Idem
- **Tabela `user_roles`:** Nenhuma alteracao de schema necessaria - ja guarda roles individuais

#### 1.3 Idiomas - MultiSelect Predefinido

**Problema atual:** Campo de texto livre para idiomas. Utilizadores podem escrever o mesmo idioma de formas diferentes.

**Solucao:**
- Definir uma lista completa de idiomas predefinidos (Portugues, Ingles, Espanhol, Frances, Alemao, Italiano, Japones, Coreano, Chines Mandarin, Russo, Arabe, Hindi, Holandes, Polaco, Sueco, Turco, etc.)
- Substituir o input livre por um campo com dropdown searchable: o utilizador escreve para filtrar, clica para adicionar
- As linguas selecionadas aparecem como badges removiveis
- Aplicar em **Onboarding.tsx** e **Settings.tsx**

---

### FASE 2: AI Draft Mode - Top 3 Candidatos

#### 2.1 Edge Function - Devolver Top 3

**Ficheiro:** `supabase/functions/find-team-match/index.ts`

**Alteracoes:**
- Mudar o prompt da IA para pedir os **Top 3** candidatos em vez de 1
- Formato de resposta JSON passa a ser um array de 3 objetos
- Cada objeto inclui: `userId`, `username`, `fullName`, `roles`, `bio`, `avgRating`, `matchScore`, `reasoning`, `highlight` (frase curta tipo "Veterano em Unity")
- Incluir tambem projetos concluidos do candidato (query extra a `project_members` + `projects` com status `concluido`)

#### 2.2 MatchDialog - UI "Draft" com 3 Cartoes

**Ficheiro:** `src/components/MatchDialog.tsx`

**Redesign completo do estado de resultado:**
- `matchData` passa de um unico objeto para um array de 3 candidatos
- Layout: 3 cards lado a lado (grid `grid-cols-1 md:grid-cols-3`)
- Cada card inclui:
  - Avatar grande com inicial
  - Nome e username
  - Estrelas de reputacao (rating visual)
  - Roles como badges
  - Projetos concluidos (lista curta)
  - Match Score como percentagem com barra de progresso circular ou linear
  - Highlight/badge gerado pela IA (ex: "Veterano em Unity")
  - Botao "Convidar" individual
- Ao clicar "Convidar", envia o convite para esse candidato e fecha o modal
- Estilo visual inspirado em draft de equipa (cards com gradientes, hover effects)
- O dialog passa de `max-w-2xl` para `max-w-5xl` para caber os 3 cards

---

### Detalhes Tecnicos

#### Novos Componentes
| Componente | Descricao |
|---|---|
| `src/components/ui/SkillTagInput.tsx` | Input de tags com auto-suggest via query a `user_roles` |
| `src/components/ui/LanguageMultiSelect.tsx` | MultiSelect searchable com lista predefinida de idiomas |

#### Ficheiros Modificados
| Ficheiro | Alteracao |
|---|---|
| `src/pages/Onboarding.tsx` | Multi-select classes, SkillTagInput, LanguageMultiSelect |
| `src/pages/Settings.tsx` | Mesmas alteracoes do Onboarding |
| `src/components/MatchDialog.tsx` | Redesign para Draft Mode com 3 cards |
| `supabase/functions/find-team-match/index.ts` | Devolver Top 3 + highlight + projetos concluidos |

#### Queries Novas na Edge Function
- Buscar projetos concluidos por candidato: `projects` com `status = 'concluido'` onde o candidato e membro ou owner
- Incluir `project_name` no resultado de cada candidato


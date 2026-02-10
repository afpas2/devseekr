

## 4 Alteracoes a Implementar

### 1. Botao "Criar Conta" (Sign Up) - Estilo Consistente

**Problema:** O botao de "Criar Conta" na pagina de registo usa `bg-gradient-secondary` (azul), enquanto o botao "Entrar" usa `bg-gradient-hero` (gradiente laranja-roxo-azul).

**Solucao:** Alterar o botao de sign up em `Auth.tsx` (linha 231-238) para usar as mesmas classes do botao de login: `bg-gradient-hero hover:opacity-90 rounded-xl shadow-elegant`.

---

### 2. Bordas Brancas Indesejaveis em Dark Mode

**Problema:** Varios componentes usam `border` default que em dark mode resulta em bordas claras que ficam feias. Componentes afetados:

**Ficheiros a modificar:**
- `src/index.css` - Ajustar a cor `--border` em dark mode para ser mais subtil (de `222 25% 18%` para `222 25% 14%`), tornando as bordas mais discretas
- `src/components/ui/card.tsx` - Mudar a classe default do Card de `border` para `border border-border/40` para bordas mais subtis em dark mode
- `src/pages/Dashboard.tsx` - O indicador de limite de plano (linha 362) tem `border border-border` que fica muito visivel; mudar para `border-border/40`

---

### 3. Explorar Projetos - Esconder Projetos do Utilizador

**Problema:** A pagina "Explorar Projetos" mostra todos os projetos, incluindo aqueles que o utilizador ja possui ou dos quais ja e membro.

**Solucao:** Em `ExploreProjects.tsx`, modificar a funcao `fetchProjects` para:
1. Obter o `user.id` atual
2. Tambem buscar os `project_members` com `user_id` (nao so o count)
3. Filtrar no cliente os projetos onde `owner_id === user.id` ou onde o utilizador e membro

Vou adicionar uma query extra para buscar os IDs dos projetos onde o utilizador e membro, e depois filtrar ambos (owned + member) antes de fazer `setProjects`.

---

### 4. Renomear "Freemium" para "Free"

**Problema:** O plano gratuito chama-se "Freemium" em toda a app e deve ser "Free".

**Ficheiros a modificar:**
- `src/pages/Pricing.tsx` - Mudar `name: "Freemium"` para `name: "Free"` (linha 36). Tambem atualizar as FAQs que mencionam "Freemium" para "Free" (linhas 87, 92)
- `src/components/layout/AppSidebar.tsx` - Mudar o texto "Freemium" para "Free" no footer do perfil (linha 228)
- `src/pages/NewProject.tsx` - Mudar "Plano Freemium" para "Plano Free" (linha 194)

Nota: O valor interno `planType: "freemium"` nos tipos e na base de dados NAO sera alterado - apenas o texto visivel ao utilizador.

---

## Resumo de Ficheiros

| Ficheiro | Alteracao |
|----------|-----------|
| `src/pages/Auth.tsx` | Botao sign up: `bg-gradient-hero` + `shadow-elegant` |
| `src/index.css` | Dark mode `--border` mais escuro |
| `src/components/ui/card.tsx` | Border mais subtil por defeito |
| `src/pages/Dashboard.tsx` | Border do indicador de plano mais subtil |
| `src/pages/ExploreProjects.tsx` | Filtrar projetos owned/member |
| `src/pages/Pricing.tsx` | "Freemium" -> "Free" no nome e FAQs |
| `src/components/layout/AppSidebar.tsx` | "Freemium" -> "Free" no footer |
| `src/pages/NewProject.tsx` | "Plano Freemium" -> "Plano Free" |


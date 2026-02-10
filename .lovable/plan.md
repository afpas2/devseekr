
## Reduzir Sidebar e Melhorar Responsividade Mobile

### 1. Reduzir largura do menu lateral

A sidebar atual tem `16rem` (256px). Vou reduzi-la para `13rem` (208px) -- uma reducao de ~19% que poupa espaco sem comprometer a legibilidade.

**Ficheiro:** `src/components/ui/sidebar.tsx`
- Alterar `SIDEBAR_WIDTH` de `"16rem"` para `"13rem"`
- Alterar `SIDEBAR_WIDTH_MOBILE` de `"18rem"` para `"15rem"`

### 2. Ajustes visuais na AppSidebar para o tamanho mais compacto

**Ficheiro:** `src/components/layout/AppSidebar.tsx`
- Reduzir o padding do header de `p-4` para `p-3`
- Reduzir o logo de `w-10 h-10` para `w-8 h-8`
- Reduzir o titulo de `text-xl` para `text-lg`
- Reduzir o gap do header de `gap-3` para `gap-2`
- Reduzir o avatar no footer de `h-9 w-9` para `h-8 w-8`
- Reduzir o padding do content de `px-2` para `px-1`

Todas as funcionalidades, icones, badges, popover e estilo de design (gradientes, active states, PRO badge) manteem-se intactos.

### 3. Responsividade mobile geral

Nenhuma alteracao adicional e necessaria -- a sidebar ja usa um `Sheet` (drawer) em mobile via o hook `useIsMobile` (breakpoint 768px), e as paginas de projeto ja usam layout full-width. A reducao de `SIDEBAR_WIDTH_MOBILE` de 18rem para 15rem tambem melhora a experiencia no drawer mobile.

---

### Resumo de Ficheiros

| Ficheiro | Alteracao |
|----------|-----------|
| `src/components/ui/sidebar.tsx` | `SIDEBAR_WIDTH`: 16rem -> 13rem, `SIDEBAR_WIDTH_MOBILE`: 18rem -> 15rem |
| `src/components/layout/AppSidebar.tsx` | Paddings, tamanhos de logo/avatar/texto reduzidos proporcionalmente |

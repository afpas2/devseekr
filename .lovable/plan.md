
## Project Quick View Dialog and Security Fixes

### Overview

This plan implements a `ProjectDetailsDialog` component for the ExploreProjects page that shows project details in a modal without navigating away, plus addresses critical security vulnerabilities identified in the codebase.

---

## PART 1: ProjectDetailsDialog Component

### 1.1 Create New Component

**File: `src/components/explore/ProjectDetailsDialog.tsx`**

A modal dialog that displays:

```text
+-------------------------------------------------------+
|                                                       |
|  [PROJECT COVER IMAGE - Medium Height ~200px]         |
|  +-------------------------------------------------+  |
|  | TITLE                         [Status Badge]   |  |
|  +-------------------------------------------------+  |
|                                                       |
+-------------------------------------------------------+
|                                                       |
|  GRID LAYOUT (2 columns on desktop)                   |
|                                                       |
|  LEFT COLUMN (60%):                                   |
|  +-------------------------------------------+        |
|  | Description                               |        |
|  | Lorem ipsum dolor sit amet...             |        |
|  +-------------------------------------------+        |
|                                                       |
|  RIGHT COLUMN (40%):                                  |
|  +-------------------------------------------+        |
|  | Quick Info                                |        |
|  |                                           |        |
|  | Methodology: [Agile badge]                |        |
|  | Current Phase: Prototyping                |        |
|  | Team Size: 3/5 members                    |        |
|  | Genre: RPG                                |        |
|  | Looking for: [Programmer] [Artist]        |        |
|  +-------------------------------------------+        |
|                                                       |
+-------------------------------------------------------+
|                                                       |
|  FOOTER                                               |
|  +-------------------------------------------+        |
|  | Team:                                     |        |
|  | [Avatar] [Avatar] [Avatar] +2 more        |        |
|  +-------------------------------------------+        |
|                                                       |
|  [Ver Pagina Completa]    [Pedir para Entrar]        |
|        (outline)              (primary)               |
|                                                       |
+-------------------------------------------------------+
```

### 1.2 Component Props and Logic

```typescript
interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    description: string;
    genre: string;
    image_url: string | null;
    status: string;
    methodology: string | null;
    looking_for_roles: string[] | null;
    owner: { full_name: string; avatar_url: string | null };
    member_count: number;
  };
  hasRequested: boolean;
  onRequestJoin: () => void;
}
```

**Additional Data Fetching:**
- Fetch project members with avatars when dialog opens
- Show max 5 avatars + "+X more" indicator
- Calculate "slots available" based on team_size vs current members

### 1.3 Integration with ExploreProjects.tsx

**Changes:**
1. Add state for `selectedProjectForDetails` and `detailsDialogOpen`
2. Change `onViewDetails` prop to open the dialog instead of navigating
3. Add "Ver Pagina Completa" button inside dialog that navigates to `/projects/:id`
4. Keep existing `JoinRequestDialog` integration for the join flow

```typescript
// New state
const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<any>(null);

// Modified handler
const handleViewDetails = (project: any) => {
  setSelectedProjectForDetails(project);
  setDetailsDialogOpen(true);
};

// In render
<ProjectListCard
  project={project}
  onViewDetails={() => handleViewDetails(project)}
  onRequestJoin={() => handleRequestJoin(project)}
  hasRequested={userRequests.has(project.id)}
/>
```

### 1.4 Visual Styling

- Use existing shadcn Dialog component
- Cover image with gradient overlay (similar to Project.tsx hero)
- Badges using existing color schemes
- Avatar stack with overlapping circles
- Responsive grid (stacked on mobile, side-by-side on desktop)

---

## PART 2: Security Fixes

### 2.1 CRITICAL: Payment Bypass Vulnerability

**Current Issue:**
The security scan identifies that the payment validation relies on client-side localStorage which can be manipulated. However, examining the code shows:

1. `activate-premium` Edge Function already uses service role (bypasses RLS)
2. User subscriptions table only has SELECT policy for users (no INSERT/UPDATE)
3. The localStorage token is just a timestamp for session validation

**Analysis:**
Looking at the actual RLS policies (line 625-629), `user_subscriptions` only has:
- SELECT policy: `auth.uid() = user_id`

There are NO INSERT or UPDATE policies visible, which means:
- Users cannot directly insert/update their subscription via client
- The Edge Function uses service role to bypass this

**Remaining Risk:**
The localStorage timestamp-based validation is weak. Anyone can:
1. Set `localStorage.setItem('payment_initiated', Date.now().toString())`
2. Navigate to `/payment-success`
3. The Edge Function will activate Premium

**Fix Required:**
The Edge Function needs to validate that payment actually occurred. Since this appears to be a sandbox/demo environment using Breezi, a proper fix would require:

1. **Option A (Webhook-based):** Breezi sends a webhook to a separate Edge Function confirming payment, which sets a secure token in the database
2. **Option B (Server-side session):** Store payment session in database instead of localStorage
3. **Option C (For demo/sandbox):** Mark this as a known limitation

For now, I'll implement **Option B** - a more secure session-based approach:

```sql
-- Add payment_sessions table
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 minutes')
);

-- RLS: Only Edge Functions can modify (using service role)
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON payment_sessions FOR SELECT
USING (auth.uid() = user_id);
```

Then modify:
- **Checkout.tsx:** Call Edge Function to create secure session before redirect
- **PaymentSuccess.tsx:** Send session token to Edge Function for validation
- **activate-premium:** Verify session exists and hasn't been used

### 2.2 Profiles Table Public Exposure

**Current Issue:**
The profiles table is publicly readable (line 261-265):
```sql
USING condition: true
```

This exposes user personal information to unauthenticated users.

**Fix:**
```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create new policy for authenticated users only
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);
```

### 2.3 Reviews Table Public Exposure

**Current Issue:**
The reviews table has "Anyone can view reviews" policy (line 607-611):
```sql
USING condition: true
```

This exposes sensitive performance data including behavioral flags.

**Fix:**
```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;

-- Create new policy for authenticated users only
CREATE POLICY "Reviews are viewable by authenticated users"
ON reviews FOR SELECT
USING (auth.uid() IS NOT NULL);
```

### 2.4 Edge Function Error Information Leakage

**Current Issue:**
The `find-team-match` function exposes detailed error messages.

**Fix:**
Update error handling in `supabase/functions/find-team-match/index.ts`:

```typescript
catch (error: any) {
  console.error("Error:", error); // Keep for server logs
  
  // Map to safe user messages
  const safeMessages: Record<string, string> = {
    'project not found': 'Projeto não encontrado',
    'Unauthorized': 'Não autorizado',
  };
  
  const safeMessage = safeMessages[error.message] || 'Erro interno do servidor';
  
  return new Response(
    JSON.stringify({ error: safeMessage }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

## FILES TO MODIFY/CREATE

| File | Operation | Description |
|------|-----------|-------------|
| `src/components/explore/ProjectDetailsDialog.tsx` | **CREATE** | New quick view modal component |
| `src/pages/ExploreProjects.tsx` | MODIFY | Integrate dialog, change click behavior |
| `supabase/migrations/[timestamp]_security_fixes.sql` | **CREATE** | RLS policy updates |
| `supabase/functions/find-team-match/index.ts` | MODIFY | Safe error messages |

---

## IMPLEMENTATION ORDER

1. **Create ProjectDetailsDialog.tsx** - New component with all visual elements
2. **Modify ExploreProjects.tsx** - Integrate dialog and change click behavior
3. **Security Migration** - Update RLS policies for profiles and reviews
4. **Edge Function Fix** - Update error handling

---

## TECHNICAL NOTES

**Dialog Content Sections:**

1. **Header/Image Section:**
   - Height: `h-48` on mobile, `md:h-56` on desktop
   - Gradient overlay: `bg-gradient-to-t from-black/70 via-black/30 to-transparent`
   - Title and status badge positioned at bottom

2. **Info Grid:**
   - Use `grid md:grid-cols-5 gap-6`
   - Left column (description): `md:col-span-3`
   - Right column (quick info): `md:col-span-2`

3. **Team Avatars:**
   - Avatar stack: `-space-x-2` with `ring-2 ring-background`
   - Max 5 visible, show `+{count}` badge for overflow

4. **Actions:**
   - "Ver Pagina Completa" - `variant="outline"`
   - "Pedir para Entrar" - `variant="default"` with gradient

**Security Note:**
The payment bypass is marked as "hard" difficulty because it requires proper payment webhook integration. The fix I'm proposing adds a database session layer but true security requires Breezi/PayPal webhook confirmation. This should be documented as a limitation for the sandbox environment.

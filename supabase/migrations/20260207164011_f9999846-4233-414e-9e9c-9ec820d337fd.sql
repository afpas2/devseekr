-- =============================================
-- FASE 1: Base de Dados - Sistema de Quests & Sprints
-- =============================================

-- Helper function to check if user is a project member or owner
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid, p_user_id uuid)
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

-- Helper function to check if user is project owner
CREATE OR REPLACE FUNCTION public.is_project_owner(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND owner_id = p_user_id
  )
$$;

-- =============================================
-- Table: sprints
-- =============================================
CREATE TABLE public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  start_date timestamptz,
  end_date timestamptz,
  status text NOT NULL DEFAULT 'future' CHECK (status IN ('future', 'active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on sprints
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sprints
CREATE POLICY "Project members can view sprints"
  ON public.sprints FOR SELECT
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can create sprints"
  ON public.sprints FOR INSERT
  WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can update sprints"
  ON public.sprints FOR UPDATE
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project owners can delete sprints"
  ON public.sprints FOR DELETE
  USING (public.is_project_owner(project_id, auth.uid()));

-- =============================================
-- Table: tasks
-- =============================================
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Project members can view tasks"
  ON public.tasks FOR SELECT
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can update tasks"
  ON public.tasks FOR UPDATE
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project owners can delete tasks"
  ON public.tasks FOR DELETE
  USING (public.is_project_owner(project_id, auth.uid()));

-- Trigger to update updated_at on tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sprints_project_id ON public.sprints(project_id);
CREATE INDEX idx_sprints_status ON public.sprints(status);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_sprint_id ON public.tasks(sprint_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
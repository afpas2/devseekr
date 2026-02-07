import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type SprintStatus = 'future' | 'active' | 'completed';

export interface Task {
  id: string;
  project_id: string;
  sprint_id: string | null;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  points: number;
  created_at: string;
  updated_at: string;
  assignee?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: SprintStatus;
  created_at: string;
}

export type SprintFilter = 'current' | 'backlog' | 'all';

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [sprintFilter, setSprintFilter] = useState<SprintFilter>('all');

  const loadTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, username, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to handle the response
      const typedTasks = (data || []).map(task => ({
        ...task,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        assignee: task.assignee as Task['assignee']
      }));
      
      setTasks(typedTasks);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast.error('Erro ao carregar tarefas');
    }
  }, [projectId]);

  const loadSprints = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      const typedSprints = (data || []).map(sprint => ({
        ...sprint,
        status: sprint.status as SprintStatus
      }));
      
      setSprints(typedSprints);
    } catch (error: any) {
      console.error('Error loading sprints:', error);
    }
  }, [projectId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadTasks(), loadSprints()]);
    setLoading(false);
  }, [loadTasks, loadSprints]);

  useEffect(() => {
    loadAll();

    // Realtime subscription for tasks
    const channel = supabase
      .channel(`project-tasks-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        () => loadTasks()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sprints', filter: `project_id=eq.${projectId}` },
        () => loadSprints()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, loadAll, loadTasks, loadSprints]);

  const createTask = async (taskData: {
    title: string;
    description?: string;
    priority: TaskPriority;
    assignee_id?: string | null;
    sprint_id?: string | null;
  }) => {
    try {
      const { error } = await supabase.from('tasks').insert({
        project_id: projectId,
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority,
        assignee_id: taskData.assignee_id || null,
        sprint_id: taskData.sprint_id || null,
        status: 'todo',
        points: 0
      });

      if (error) throw error;
      toast.success('Quest criada com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa');
      return false;
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast.error('Erro ao atualizar tarefa');
      return false;
    }
  };

  const optimisticUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));
  };

  const rollbackTask = (taskId: string, oldStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: oldStatus } : t
    ));
  };

  // Filter tasks based on sprint filter
  const getFilteredTasks = () => {
    const activeSprint = sprints.find(s => s.status === 'active');

    switch (sprintFilter) {
      case 'current':
        return activeSprint 
          ? tasks.filter(t => t.sprint_id === activeSprint.id)
          : tasks.filter(t => t.sprint_id === null);
      case 'backlog':
        return tasks.filter(t => t.sprint_id === null);
      case 'all':
      default:
        return tasks;
    }
  };

  return {
    tasks,
    sprints,
    loading,
    sprintFilter,
    setSprintFilter,
    getFilteredTasks,
    createTask,
    updateTaskStatus,
    optimisticUpdateStatus,
    rollbackTask,
    refresh: loadAll
  };
}

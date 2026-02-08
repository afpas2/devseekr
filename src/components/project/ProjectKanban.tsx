import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay
} from "@dnd-kit/core";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Sparkles, Target } from "lucide-react";
import { useTasks, TaskStatus, Task } from "@/hooks/useTasks";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { SprintSelector } from "./SprintSelector";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { CreateSprintDialog } from "./CreateSprintDialog";

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

interface ProjectKanbanProps {
  projectId: string;
  members: Member[];
}

const COLUMNS = [
  { id: 'todo' as TaskStatus, title: 'Backlog', colorClass: 'bg-slate-500/10' },
  { id: 'in_progress' as TaskStatus, title: 'Em Progresso', colorClass: 'bg-blue-500/10' },
  { id: 'review' as TaskStatus, title: 'Revisão', colorClass: 'bg-amber-500/10' },
  { id: 'done' as TaskStatus, title: 'Feito', colorClass: 'bg-green-500/10' }
];

export function ProjectKanban({ projectId, members }: ProjectKanbanProps) {
  const {
    sprints,
    loading,
    sprintFilter,
    setSprintFilter,
    getFilteredTasks,
    createTask,
    createSprint,
    updateTaskStatus,
    optimisticUpdateStatus,
    rollbackTask
  } = useTasks(projectId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateSprintDialog, setShowCreateSprintDialog] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const filteredTasks = getFilteredTasks();

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(t => t.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = filteredTasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Handle drag over for visual feedback
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = filteredTasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine the target status
    let newStatus: TaskStatus;
    
    // Check if dropped on a column
    if (COLUMNS.some(c => c.id === over.id)) {
      newStatus = over.id as TaskStatus;
    } else {
      // Dropped on another task - find that task's status
      const targetTask = filteredTasks.find(t => t.id === over.id);
      if (!targetTask) return;
      newStatus = targetTask.status;
    }

    // Don't update if status hasn't changed
    if (task.status === newStatus) return;

    const oldStatus = task.status;

    // Optimistic update
    optimisticUpdateStatus(taskId, newStatus);

    // Fire confetti if moved to done
    if (newStatus === 'done') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7']
      });
    }

    // Persist to database
    const success = await updateTaskStatus(taskId, newStatus);
    
    if (!success) {
      // Rollback on error
      rollbackTask(taskId, oldStatus);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SprintSelector
          value={sprintFilter}
          onChange={setSprintFilter}
          sprints={sprints}
        />
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowCreateSprintDialog(true)}
            className="gap-2"
          >
            <Target className="w-4 h-4" />
            Criar Sprint
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar Quest
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksByStatus(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[240px]">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Nenhuma Quest ainda</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Cria a primeira tarefa para começar a gerir o trabalho da equipa.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Primeira Quest
          </Button>
        </div>
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        members={members}
        sprints={sprints}
        defaultSprintId={sprintFilter !== 'all' && sprintFilter !== 'backlog' ? sprintFilter : undefined}
        onCreateTask={createTask}
      />

      {/* Create Sprint Dialog */}
      <CreateSprintDialog
        open={showCreateSprintDialog}
        onOpenChange={setShowCreateSprintDialog}
        onCreateSprint={createSprint}
      />
    </div>
  );
}

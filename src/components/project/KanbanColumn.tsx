import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "@/hooks/useTasks";

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  colorClass: string;
}

interface KanbanColumnProps {
  column: ColumnConfig;
  tasks: Task[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id
  });

  const taskIds = tasks.map(t => t.id);

  return (
    <div className="flex-1 min-w-[240px] max-w-[300px]">
      <div className={`rounded-lg p-3 ${column.colorClass} transition-colors ${isOver ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        <div
          ref={setNodeRef}
          className="space-y-2 min-h-[200px]"
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>
          
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-20 border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <p className="text-xs text-muted-foreground">Arrasta uma quest aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

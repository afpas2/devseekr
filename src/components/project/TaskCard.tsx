import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GripVertical } from "lucide-react";
import type { Task } from "@/hooks/useTasks";

interface TaskCardProps {
  task: Task;
}

const priorityConfig = {
  low: { label: 'Baixa', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  medium: { label: 'Média', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  high: { label: 'Alta', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  critical: { label: 'Crítica', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' }
};

export function TaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: { task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  };

  const priority = priorityConfig[task.priority];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-grab active:cursor-grabbing border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1.5 py-0 ${priority.className} border`}
            >
              {priority.label}
            </Badge>
            
            {task.assignee && (
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={task.assignee.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  {task.assignee.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          
          <p className="font-medium text-sm leading-tight truncate">
            {task.title}
          </p>
          
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target } from "lucide-react";
import type { SprintFilter, Sprint, SprintStatus } from "@/hooks/useTasks";

interface SprintSelectorProps {
  value: SprintFilter;
  onChange: (value: SprintFilter) => void;
  sprints: Sprint[];
}

const statusLabels: Record<SprintStatus, string> = {
  active: 'Ativo',
  future: 'Futuro',
  completed: 'Concluído'
};

const statusEmojis: Record<SprintStatus, string> = {
  active: '🟢',
  future: '🔵',
  completed: '✓'
};

export function SprintSelector({ value, onChange, sprints }: SprintSelectorProps) {
  // Get display value for the trigger
  const getDisplayValue = () => {
    if (value === 'all') return 'Todas as Quests';
    if (value === 'backlog') return 'Backlog Geral';
    const sprint = sprints.find(s => s.id === value);
    return sprint ? sprint.name : 'Selecionar';
  };

  return (
    <div className="flex items-center gap-2">
      <Target className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>{getDisplayValue()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Quests</SelectItem>
          <SelectItem value="backlog">Backlog Geral</SelectItem>
          
          {sprints.length > 0 && (
            <>
              <SelectSeparator />
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  <span className="flex items-center gap-2">
                    <span>{statusEmojis[sprint.status]}</span>
                    <span>{sprint.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({statusLabels[sprint.status]})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

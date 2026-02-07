import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target } from "lucide-react";
import type { SprintFilter, Sprint } from "@/hooks/useTasks";

interface SprintSelectorProps {
  value: SprintFilter;
  onChange: (value: SprintFilter) => void;
  sprints: Sprint[];
}

export function SprintSelector({ value, onChange, sprints }: SprintSelectorProps) {
  const activeSprint = sprints.find(s => s.status === 'active');

  return (
    <div className="flex items-center gap-2">
      <Target className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as SprintFilter)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Quests</SelectItem>
          <SelectItem value="current">
            {activeSprint ? activeSprint.name : 'Sprint Atual'}
          </SelectItem>
          <SelectItem value="backlog">Backlog Geral</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

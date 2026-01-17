import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  genreFilter: string;
  onGenreChange: (value: string) => void;
  roleFilter: string;
  onRoleChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

const GENRES = [
  "RPG",
  "FPS",
  "Puzzle",
  "Adventure",
  "Strategy",
  "Platformer",
  "Horror",
  "Simulation",
  "Roguelike",
  "Fighting",
];

const ROLES = [
  "Programmer",
  "Artist",
  "Designer",
  "Sound Designer",
  "Writer",
  "QA Tester",
  "Producer",
  "Animator",
];

const STATUSES = ["planning", "in_progress", "beta", "released"];

export const ProjectFilters = ({
  searchQuery,
  onSearchChange,
  genreFilter,
  onGenreChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
}: ProjectFiltersProps) => {
  return (
    <Card className="p-6 space-y-5 border-border/50 hover:border-primary/10 transition-colors">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          Pesquisar Projetos
        </Label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Nome ou descrição do projeto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-border/50 focus:border-primary/30"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span>Filtros</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="genre" className="text-sm">Género</Label>
          <Select value={genreFilter} onValueChange={onGenreChange}>
            <SelectTrigger id="genre" className="border-border/50">
              <SelectValue placeholder="Todos os géneros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os géneros</SelectItem>
              {GENRES.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm">Função Necessária</Label>
          <Select value={roleFilter} onValueChange={onRoleChange}>
            <SelectTrigger id="role" className="border-border/50">
              <SelectValue placeholder="Todas as funções" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm">Estado</Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger id="status" className="border-border/50">
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};

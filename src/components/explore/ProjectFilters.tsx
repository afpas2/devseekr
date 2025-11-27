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
import { Search } from "lucide-react";

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
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Pesquisar Projetos</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Nome do projeto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="genre">Gênero</Label>
          <Select value={genreFilter} onValueChange={onGenreChange}>
            <SelectTrigger id="genre">
              <SelectValue placeholder="Todos os gêneros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os gêneros</SelectItem>
              {GENRES.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role Necessária</Label>
          <Select value={roleFilter} onValueChange={onRoleChange}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Todas as roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as roles</SelectItem>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2 } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    genre: string;
    image_url: string | null;
    status: string;
  };
  onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-elegant transition-all overflow-hidden group"
      onClick={onClick}
    >
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Gamepad2 className={`w-16 h-16 text-muted-foreground fallback-icon ${project.image_url ? 'hidden' : ''}`} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg line-clamp-1">{project.name}</h3>
          <Badge 
            variant={project.status === 'concluido' ? 'default' : 'secondary'} 
            className={`ml-2 flex-shrink-0 ${project.status === 'concluido' ? 'bg-green-600' : ''}`}
          >
            {project.status === 'concluido' ? 'Concluído' : project.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {project.description}
        </p>
        <Badge className="bg-gradient-primary">{project.genre}</Badge>
      </div>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Users, Calendar } from "lucide-react";

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
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'concluido':
        return { label: 'Concluído', className: 'bg-green-500/10 text-green-600 border-green-500/20' };
      case 'in_progress':
        return { label: 'Em Progresso', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'planning':
        return { label: 'Planeamento', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      default:
        return { label: status, className: 'bg-muted text-muted-foreground' };
    }
  };

  const statusConfig = getStatusConfig(project.status);

  return (
    <Card
      className="cursor-pointer group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-elegant animate-fade-in"
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="aspect-video bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center relative overflow-hidden">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`fallback-icon flex flex-col items-center justify-center gap-2 text-muted-foreground ${project.image_url ? 'hidden' : ''}`}>
          <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10">
            <Gamepad2 className="w-12 h-12" />
          </div>
        </div>
        
        {/* Status badge overlay */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant="outline"
            className={`${statusConfig.className} backdrop-blur-sm border shadow-sm`}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>
      
      <div className="p-5 relative">
        <h3 className="font-bold text-lg line-clamp-1 mb-2 group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
        
        <div className="flex items-center justify-between">
          <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-sm">
            {project.genre}
          </Badge>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Projeto</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

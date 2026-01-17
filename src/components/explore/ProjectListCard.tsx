import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gamepad2, Users, UserPlus, Sparkles } from "lucide-react";

interface ProjectListCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    genre: string;
    image_url: string | null;
    status: string;
    looking_for_roles: string[] | null;
    owner: {
      full_name: string;
      avatar_url: string | null;
    };
    member_count: number;
  };
  onViewDetails: () => void;
  onRequestJoin: () => void;
  hasRequested: boolean;
}

export const ProjectListCard = ({
  project,
  onViewDetails,
  onRequestJoin,
  hasRequested,
}: ProjectListCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
    <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-elegant cursor-pointer group animate-fade-in">
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div
          className="w-full md:w-56 h-48 md:h-auto bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center relative overflow-hidden flex-shrink-0"
          onClick={onViewDetails}
        >
          {project.image_url ? (
            <img
              src={project.image_url}
              alt={project.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10">
                <Gamepad2 className="w-10 h-10" />
              </div>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 space-y-4">
          <div onClick={onViewDetails}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {project.name}
              </h3>
              <Badge 
                variant="outline" 
                className={`${statusConfig.className} border flex-shrink-0`}
              >
                {statusConfig.label}
              </Badge>
            </div>

            <p className="text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
              {project.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-sm">
                {project.genre}
              </Badge>
              {project.looking_for_roles && project.looking_for_roles.length > 0 && (
                <>
                  {project.looking_for_roles.slice(0, 3).map((role, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="border-primary/30 text-primary bg-primary/5"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {role}
                    </Badge>
                  ))}
                  {project.looking_for_roles.length > 3 && (
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      +{project.looking_for_roles.length - 3}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-5">
              {/* Owner */}
              <div className="flex items-center gap-2.5">
                <Avatar className="w-7 h-7 ring-2 ring-background">
                  <AvatarImage src={project.owner.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                    {getInitials(project.owner.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground font-medium">
                  {project.owner.full_name}
                </span>
              </div>

              {/* Member Count */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{project.member_count} membros</span>
              </div>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRequestJoin();
              }}
              disabled={hasRequested}
              variant={hasRequested ? "outline" : "default"}
              className={`gap-2 ${!hasRequested ? 'bg-gradient-primary hover:opacity-90' : ''}`}
            >
              <UserPlus className="w-4 h-4" />
              {hasRequested ? "Pedido Enviado" : "Pedir Entrada"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

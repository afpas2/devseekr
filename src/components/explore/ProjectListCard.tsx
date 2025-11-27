import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gamepad2, Users, UserPlus } from "lucide-react";

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

  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-all cursor-pointer group">
      <div className="flex flex-col md:flex-row">
        <div
          className="w-full md:w-48 h-48 md:h-auto bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
          onClick={onViewDetails}
        >
          {project.image_url ? (
            <img
              src={project.image_url}
              alt={project.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <Gamepad2 className="w-16 h-16 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 p-6 space-y-4">
          <div onClick={onViewDetails}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <Badge variant="secondary">{project.status}</Badge>
            </div>

            <p className="text-muted-foreground line-clamp-2 mb-3">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-gradient-primary">{project.genre}</Badge>
              {project.looking_for_roles && project.looking_for_roles.length > 0 && (
                <>
                  {project.looking_for_roles.slice(0, 3).map((role, index) => (
                    <Badge key={index} variant="outline" className="border-primary/30 text-primary">
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

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={project.owner.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(project.owner.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {project.owner.full_name}
                </span>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{project.member_count} membros</span>
              </div>
            </div>

            <Button
              onClick={onRequestJoin}
              disabled={hasRequested}
              variant={hasRequested ? "outline" : "default"}
              className="gap-2"
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

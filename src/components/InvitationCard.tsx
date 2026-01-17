import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Gamepad2, User } from "lucide-react";

interface InvitationCardProps {
  invitation: {
    id: string;
    message: string | null;
    projects: {
      name: string;
      genre: string;
    };
    profiles: {
      username: string;
    };
  };
  onAccept: () => void;
  onDecline: () => void;
}

export const InvitationCard = ({
  invitation,
  onAccept,
  onDecline,
}: InvitationCardProps) => {
  return (
    <Card className="p-4 border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-md animate-fade-in group">
      <div className="flex items-start gap-4">
        {/* Project Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
          <Gamepad2 className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {invitation.projects.name}
            </h4>
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              {invitation.projects.genre}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <User className="w-3.5 h-3.5" />
            <span>de @{invitation.profiles.username}</span>
          </div>
          
          {invitation.message && (
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 mb-3">
              <p className="text-sm text-muted-foreground italic line-clamp-2">
                "{invitation.message}"
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onAccept}
              className="flex-1 bg-gradient-primary hover:opacity-90 shadow-sm group/btn"
            >
              <Check className="w-4 h-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
              Aceitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDecline}
              className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <X className="w-4 h-4 mr-1.5" />
              Recusar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

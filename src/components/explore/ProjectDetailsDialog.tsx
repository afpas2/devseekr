import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Gamepad2, 
  Settings2, 
  TrendingUp,
  ExternalLink,
  UserPlus,
  CheckCircle2,
  Clock
} from "lucide-react";

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    description: string;
    genre: string;
    image_url: string | null;
    status: string;
    methodology: string | null;
    looking_for_roles: string[] | null;
    owner: { full_name: string; avatar_url: string | null };
    member_count: number;
  } | null;
  hasRequested: boolean;
  onRequestJoin: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  planning: { label: "Planeamento", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <Clock className="w-3 h-3" /> },
  "in-progress": { label: "Em Progresso", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <TrendingUp className="w-3 h-3" /> },
  concluido: { label: "Concluído", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const methodologyConfig: Record<string, { label: string; color: string }> = {
  Casual: { label: "Casual", color: "bg-muted text-muted-foreground" },
  Agile: { label: "Agile", color: "bg-primary/10 text-primary" },
  Waterfall: { label: "Waterfall", color: "bg-secondary/80 text-secondary-foreground" },
};

export function ProjectDetailsDialog({
  open,
  onOpenChange,
  project,
  hasRequested,
  onRequestJoin,
}: ProjectDetailsDialogProps) {
  const navigate = useNavigate();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (open && project) {
      fetchMembers();
    }
  }, [open, project?.id]);

  const fetchMembers = async () => {
    if (!project) return;
    
    setIsLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          id,
          user_id,
          role,
          profile:profiles!project_members_user_id_fkey(full_name, avatar_url)
        `)
        .eq("project_id", project.id)
        .limit(6);

      if (error) throw error;
      
      // Transform nested profile data
      const transformedMembers = (data || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        profile: member.profile || { full_name: "Membro", avatar_url: null },
      }));
      
      setMembers(transformedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  if (!project) return null;

  const status = statusConfig[project.status] || statusConfig.planning;
  const methodology = methodologyConfig[project.methodology || "Casual"] || methodologyConfig.Casual;
  const maxTeamSize = 5; // Default team size
  const currentMembers = project.member_count + 1; // +1 for owner
  const slotsAvailable = Math.max(0, maxTeamSize - currentMembers);
  
  // Include owner in the display
  const allTeamMembers = [
    { 
      id: "owner", 
      user_id: "owner",
      role: "Owner",
      profile: project.owner 
    },
    ...members.slice(0, 4)
  ];
  
  const remainingCount = project.member_count > 4 ? project.member_count - 4 : 0;

  const handleViewFullPage = () => {
    onOpenChange(false);
    navigate(`/projects/${project.id}`);
  };

  const handleRequestJoin = () => {
    onOpenChange(false);
    onRequestJoin();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
        {/* Cover Image Section */}
        <div className="relative h-48 md:h-56 w-full">
          {project.image_url ? (
            <img
              src={project.image_url}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
              <Gamepad2 className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Title and Badge */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold text-white line-clamp-2">
                {project.name}
              </h2>
              <Badge className={`${status.color} border shrink-0 flex items-center gap-1`}>
                {status.icon}
                {status.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-5 gap-6">
            {/* Left Column - Description */}
            <div className="md:col-span-3 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Descrição
              </h3>
              <p className="text-foreground leading-relaxed">
                {project.description || "Sem descrição disponível."}
              </p>
            </div>

            {/* Right Column - Quick Info */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Informações
              </h3>
              
              <div className="space-y-3">
                {/* Methodology */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Metodologia
                  </span>
                  <Badge variant="secondary" className={methodology.color}>
                    {methodology.label}
                  </Badge>
                </div>

                {/* Genre */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    Género
                  </span>
                  <span className="text-sm font-medium">{project.genre}</span>
                </div>

                {/* Team Size */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Equipa
                  </span>
                  <span className="text-sm font-medium">
                    {currentMembers}/{maxTeamSize} membros
                  </span>
                </div>

                {/* Looking For Roles */}
                {project.looking_for_roles && project.looking_for_roles.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                      <UserPlus className="w-4 h-4" />
                      À procura de:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {project.looking_for_roles.slice(0, 4).map((role) => (
                        <Badge 
                          key={role} 
                          variant="outline" 
                          className="text-xs bg-primary/5 border-primary/20 text-primary"
                        >
                          {role}
                        </Badge>
                      ))}
                      {project.looking_for_roles.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.looking_for_roles.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Team Avatars */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Equipa:</span>
                <div className="flex -space-x-2">
                  {allTeamMembers.map((member, index) => (
                    <Avatar 
                      key={member.id} 
                      className="w-8 h-8 ring-2 ring-background"
                      style={{ zIndex: allTeamMembers.length - index }}
                    >
                      <AvatarImage src={member.profile.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-muted">
                        {member.profile.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {remainingCount > 0 && (
                    <div 
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background"
                      style={{ zIndex: 0 }}
                    >
                      +{remainingCount}
                    </div>
                  )}
                </div>
              </div>

              {slotsAvailable > 0 && (
                <span className="text-sm text-muted-foreground">
                  {slotsAvailable} {slotsAvailable === 1 ? "vaga" : "vagas"} disponível
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleViewFullPage}
              className="flex-1 sm:flex-none"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Página Completa
            </Button>
            
            <Button 
              onClick={handleRequestJoin}
              disabled={hasRequested}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {hasRequested ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Pedido Enviado
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Pedir para Entrar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

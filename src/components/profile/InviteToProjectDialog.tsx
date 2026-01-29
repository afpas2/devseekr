import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  genre: string;
  status: string;
  image_url: string | null;
}

interface InviteToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUsername: string;
}

export const InviteToProjectDialog = ({
  open,
  onOpenChange,
  targetUserId,
  targetUsername,
}: InviteToProjectDialogProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadMyProjects();
    }
  }, [open, targetUserId]);

  const loadMyProjects = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get projects where I'm the owner
      const { data: myProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, genre, status, image_url')
        .eq('owner_id', user.id)
        .neq('status', 'concluido');

      if (projectsError) throw projectsError;

      // Get projects where target user is already a member
      const { data: targetMemberships } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', targetUserId);

      const memberProjectIds = new Set(targetMemberships?.map(m => m.project_id) || []);

      // Get existing pending invitations to the target user
      const { data: existingInvites } = await supabase
        .from('project_invitations')
        .select('project_id')
        .eq('recipient_id', targetUserId)
        .eq('status', 'pending');

      const pendingInviteIds = new Set(existingInvites?.map(i => i.project_id) || []);

      // Filter out projects where user is already a member or has pending invite
      const availableProjects = (myProjects || []).filter(
        p => !memberProjectIds.has(p.id) && !pendingInviteIds.has(p.id)
      );

      setProjects(availableProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (projectId: string, projectName: string) => {
    setSendingId(projectId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Create invitation
      const { error: inviteError } = await supabase
        .from('project_invitations')
        .insert({
          project_id: projectId,
          sender_id: user.id,
          recipient_id: targetUserId,
          message: null,
          status: 'pending',
        });

      if (inviteError) {
        if (inviteError.code === '23505') {
          toast({
            title: "Já convidado",
            description: "Este utilizador já foi convidado para este projeto.",
            variant: "destructive",
          });
          return;
        }
        throw inviteError;
      }

      // Send notification
      await supabase.from('notifications').insert({
        recipient_id: targetUserId,
        sender_id: user.id,
        type: 'project_invitation',
        message: `Foste convidado para o projeto "${projectName}"`,
        project_id: projectId,
      });

      setSentIds(prev => new Set(prev).add(projectId));
      toast({
        title: "Convite enviado!",
        description: `@${targetUsername} foi convidado para ${projectName}`,
      });

    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o convite.",
        variant: "destructive",
      });
    } finally {
      setSendingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planeamento';
      case 'in_progress': return 'Em Progresso';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Convidar para Projeto
          </DialogTitle>
          <DialogDescription>
            Escolhe um projeto para convidar <strong>@{targetUsername}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Sem projetos disponíveis</p>
              <p className="text-sm">
                Não tens projetos ativos para convidar este utilizador.
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{project.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{project.genre}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(project.status || 'planning')}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleInvite(project.id, project.name)}
                  disabled={sendingId === project.id || sentIds.has(project.id)}
                  className={sentIds.has(project.id) ? "bg-green-600 hover:bg-green-600" : ""}
                >
                  {sendingId === project.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : sentIds.has(project.id) ? (
                    "Enviado"
                  ) : (
                    "Convidar"
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

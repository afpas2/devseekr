import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Sparkles, Loader2, Edit, LogOut, MessageCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { TeamMember } from "@/components/TeamMember";
import { MatchDialog } from "@/components/MatchDialog";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import ProjectChat from "@/components/project/ProjectChat";
import Header from "@/components/layout/Header";
import { ProjectJoinRequests } from "@/components/project/ProjectJoinRequests";
import { useProjectCalls } from "@/hooks/useProjectCalls";
import { CallButton } from "@/components/calls/CallButton";
import { ActiveCallView } from "@/components/calls/ActiveCallView";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectData {
  id: string;
  name: string;
  description: string;
  genre: string;
  image_url: string | null;
  status: string;
  owner_id: string;
  communication_link: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

const Project = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Hook de chamadas
  const {
    activeCall,
    participants,
    isInCall,
    startCall,
    joinCall,
    leaveCall,
  } = useProjectCalls(id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session && id) {
      loadProject();
    }
  }, [session, id]);

  const loadProject = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select(`
          *,
          profiles(username, full_name)
        `)
        .eq("project_id", id);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveProject = async () => {
    try {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", id!)
        .eq("user_id", session!.user.id);

      if (error) throw error;

      toast.success("Saíste do projeto com sucesso");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCompleteProject = async () => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: "concluido" })
        .eq("id", id!);

      if (error) throw error;

      toast.success("Projeto marcado como concluído!");
      loadProject();
      setShowCompleteDialog(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!session || loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOwner = project.owner_id === session.user.id;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            {isOwner && project.status !== 'concluido' && (
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowCompleteDialog(true)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Concluir Projeto
              </Button>
            )}
            {!isOwner && (
              <Button
                variant="destructive"
                onClick={() => setShowLeaveDialog(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair do Projeto
              </Button>
            )}
          </div>

          {/* Project Header */}
          <Card className="p-8 mb-6 shadow-elegant">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="aspect-video w-full md:w-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center overflow-hidden">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={project.status === 'concluido' ? 'default' : 'secondary'}
                    className={project.status === 'concluido' ? 'bg-green-600' : ''}
                  >
                    {project.status === 'concluido' ? 'Concluído' : project.status}
                  </Badge>
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditDialog(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
              <Badge className="bg-gradient-primary mb-4">{project.genre}</Badge>
              <p className="text-muted-foreground mb-4">{project.description}</p>
              {project.communication_link && (
                <a
                  href={project.communication_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <MessageCircle className="w-4 h-4" />
                  Link de Comunicação da Equipa
                </a>
              )}
            </div>
            </div>
          </Card>

          {/* Join Requests Section - Only visible to owner */}
          {isOwner && (
            <ProjectJoinRequests projectId={id!} onRequestsChange={loadProject} />
          )}

          {/* Team Section */}
          <Card className="p-6 mb-6 shadow-elegant">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h2 className="text-xl font-bold">Team Members</h2>
              <span className="text-sm text-muted-foreground">
                ({members.length})
              </span>
            </div>
            {isOwner && (
              <Button
                onClick={() => setShowMatchDialog(true)}
                className="bg-gradient-secondary hover:opacity-90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Find Team Member
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {members.map((member) => (
              <TeamMember key={member.id} member={member} />
            ))}
            </div>
          </Card>

          {/* Voice Call Section */}
          {isInCall && activeCall && session?.user ? (
            <ActiveCallView
              callId={activeCall.id}
              userId={session.user.id}
              participants={participants}
              onLeave={leaveCall}
            />
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Chamada de Voz</CardTitle>
                <CardDescription>
                  {activeCall ? 'Uma chamada está em curso. Entre para participar!' : 'Inicie uma chamada de voz com a equipa'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CallButton
                  hasActiveCall={!!activeCall}
                  isInCall={isInCall}
                  onStartCall={startCall}
                  onJoinCall={() => activeCall && joinCall(activeCall.id)}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Chat da Equipa</CardTitle>
              <CardDescription>Comunique com os membros da equipa em tempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectChat projectId={id!} />
            </CardContent>
          </Card>
        </div>
      </main>

      <MatchDialog
        open={showMatchDialog}
        onOpenChange={setShowMatchDialog}
        projectId={id!}
        onInviteSent={() => {
          setShowMatchDialog(false);
          toast.success("Convite enviado!");
        }}
      />

      <EditProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        project={project}
        onProjectUpdated={loadProject}
      />

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do Projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres sair do projeto "{project.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveProject}>
              Sair do Projeto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres marcar o projeto "{project.name}" como concluído? O projeto será encerrado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteProject} className="bg-green-600 hover:bg-green-700">
              Concluir Projeto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Project;

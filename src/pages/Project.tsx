import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Sparkles, Loader2, Edit, LogOut, MessageCircle, CheckCircle, Phone, Gamepad2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { TeamMember } from "@/components/TeamMember";
import { MatchDialog } from "@/components/MatchDialog";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import ProjectChat from "@/components/project/ProjectChat";
import { ProjectJoinRequests } from "@/components/project/ProjectJoinRequests";
import { ProjectCallButton } from "@/components/calls/ProjectCallButton";
import { useCallContext } from "@/contexts/CallContext";
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
  methodology: string | null;
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

  const { isInCall, activeCall, toggleMinimize } = useCallContext();

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

      toast.success("Projeto concluído! Vamos avaliar a equipa.");
      setShowCompleteDialog(false);
      
      // Redirect to review wizard
      navigate(`/projects/${id}/review`);
    } catch (error: any) {
      toast.error(error.message);
    }
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

  if (!session || loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar projeto...</p>
        </div>
      </div>
    );
  }

  const isOwner = project.owner_id === session.user.id;
  const isInThisCall = isInCall && activeCall?.project_id === id;
  const statusConfig = getStatusConfig(project.status);

  const getMethodologyConfig = (methodology: string | null) => {
    switch (methodology) {
      case 'Agile':
        return { label: 'Agile', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'Scrum':
        return { label: 'Scrum', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'Kanban':
        return { label: 'Kanban', className: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' };
      case 'Waterfall':
        return { label: 'Waterfall', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' };
      default:
        return { label: 'Casual', className: 'bg-muted text-muted-foreground' };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")} 
          className="mb-6 hover:bg-primary/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Hero Section - Immersive Full Width */}
          <div className="relative rounded-2xl overflow-hidden animate-fade-in">
            {/* Hero Image */}
            <div className="h-72 md:h-96 relative">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex items-center justify-center">
                  <div className="p-8 rounded-full bg-background/30 backdrop-blur-sm">
                    <Gamepad2 className="w-20 h-20 text-muted-foreground" />
                  </div>
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Status Badge - Top Right */}
              <div className="absolute top-4 right-4">
                <Badge 
                  variant="outline" 
                  className={`${statusConfig.className} border backdrop-blur-sm shadow-lg`}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              
              {/* Content Overlay - Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  {/* Left Side - Title and Badges */}
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
                      {project.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {project.genre}
                      </Badge>
                      {project.methodology && (
                        <Badge 
                          variant="outline" 
                          className={`${getMethodologyConfig(project.methodology).className} border backdrop-blur-sm`}
                        >
                          {getMethodologyConfig(project.methodology).label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Side - Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {isOwner && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowEditDialog(true)}
                        className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                    )}
                    {isOwner && project.status !== 'concluido' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg"
                        onClick={() => setShowCompleteDialog(true)}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Concluir
                      </Button>
                    )}
                    {!isOwner && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowLeaveDialog(true)}
                        className="gap-2 shadow-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <Card className="p-6 border-border/50 animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <p className="text-muted-foreground leading-relaxed">
              {project.description}
            </p>
            
            {project.communication_link && (
              <a
                href={project.communication_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4"
              >
                <MessageCircle className="w-4 h-4" />
                Link de Comunicação da Equipa
              </a>
            )}
          </Card>

          {/* Join Requests Section - Only visible to owner */}
          {isOwner && (
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <ProjectJoinRequests projectId={id!} onRequestsChange={loadProject} />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Team Section */}
            <Card className="border-border/50 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Equipa</CardTitle>
                      <CardDescription>{members.length} membros</CardDescription>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      onClick={() => setShowMatchDialog(true)}
                      className="bg-gradient-secondary hover:opacity-90 gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Encontrar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((member) => (
                  <TeamMember key={member.id} member={member} />
                ))}
              </CardContent>
            </Card>

            {/* Voice Call Section */}
            <Card className="border-border/50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Chamada de Voz</CardTitle>
                    <CardDescription>
                      {isInThisCall 
                        ? 'Estás numa chamada'
                        : 'Comunica com a equipa'
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isInThisCall ? (
                  <Button 
                    onClick={toggleMinimize} 
                    variant="outline" 
                    className="w-full gap-2 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-700 dark:hover:text-green-400"
                  >
                    <Phone className="h-4 w-4" />
                    Expandir Chamada
                  </Button>
                ) : (
                  <ProjectCallButton projectId={id!} projectName={project.name} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Section */}
          <Card className="border-border/50 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                  <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Chat da Equipa</CardTitle>
                  <CardDescription>Comunique com os membros em tempo real</CardDescription>
                </div>
              </div>
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

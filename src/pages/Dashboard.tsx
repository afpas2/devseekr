import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Mail, Gamepad2, Compass, FolderKanban, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ProjectCard } from "@/components/ProjectCard";
import { InvitationCard } from "@/components/InvitationCard";
import { useUserPlan } from "@/hooks/useUserPlan";

interface Project {
  id: string;
  name: string;
  description: string;
  genre: string;
  image_url: string | null;
  status: string;
}

interface Invitation {
  id: string;
  project_id: string;
  message: string | null;
  created_at: string;
  projects: {
    name: string;
    genre: string;
  };
  profiles: {
    username: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");
  const { plan, limits, projectsCreatedThisMonth, canCreateProject } = useUserPlan();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile) {
        navigate("/onboarding");
      } else {
        setUsername(profile.username);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      const { data: ownedProjects, error: ownedError } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", session?.user.id);

      if (ownedError) throw ownedError;

      const { data: memberProjectsData, error: memberError } = await supabase
        .from("project_members")
        .select("projects(*)")
        .eq("user_id", session?.user.id);

      if (memberError) throw memberError;

      const memberProjects = memberProjectsData?.map((item: any) => item.projects).filter(Boolean) || [];

      const allProjects = [
        ...(ownedProjects || []),
        ...memberProjects
      ];
      
      const uniqueProjects = Array.from(
        new Map(allProjects.map(p => [p.id, p])).values()
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setProjects(uniqueProjects);

      const { data: invitationsData, error: invitationsError } = await supabase
        .from("project_invitations")
        .select(`
          *,
          projects(name, genre),
          profiles!project_invitations_sender_id_fkey(username)
        `)
        .eq("recipient_id", session?.user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (invitationsError) throw invitationsError;
      setInvitations(invitationsData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) return;

      const { error: updateError } = await supabase
        .from("project_invitations")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      if (accept) {
        const { error: memberError } = await supabase
          .from("project_members")
          .insert({
            project_id: invitation.project_id,
            user_id: session?.user.id,
            role: "Member",
          });

        if (memberError) throw memberError;
      }

      toast.success(accept ? "Convite aceite!" : "Convite recusado");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleNewProject = () => {
    if (!canCreateProject) {
      toast.error(`Limite de ${limits.maxProjectsPerMonth} projetos/mês atingido. Faz upgrade para Premium!`);
      navigate("/pricing");
      return;
    }
    navigate("/projects/new");
  };

  if (!session || loading) return null;

  const activeProjects = projects.filter(p => p.status !== 'concluido').length;
  const completedProjects = projects.filter(p => p.status === 'concluido').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">
            Olá, {username}! 👋
          </h1>
          <p className="text-muted-foreground">
            {activeProjects > 0 
              ? `Tens ${activeProjects} projeto${activeProjects > 1 ? 's' : ''} ativo${activeProjects > 1 ? 's' : ''}.`
              : "Começa criando o teu primeiro projeto ou explora projetos existentes."
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Projetos</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeProjects}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedProjects}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invitations.length}</p>
                <p className="text-sm text-muted-foreground">Convites</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-display">Os Teus Projetos</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate("/explore-projects")}
                    variant="outline"
                    className="gap-2"
                  >
                    <Compass className="w-4 h-4" />
                    Explorar
                  </Button>
                  <Button
                    onClick={handleNewProject}
                    className="bg-gradient-primary hover:opacity-90 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Projeto
                  </Button>
                </div>
              </div>

              {/* Plan limit indicator */}
              {plan === 'freemium' && (
                <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Projetos este mês: <strong>{projectsCreatedThisMonth}/{limits.maxProjectsPerMonth}</strong>
                  </span>
                  {!canCreateProject && (
                    <Button size="sm" variant="outline" onClick={() => navigate("/pricing")} className="text-xs">
                      Fazer Upgrade
                    </Button>
                  )}
                </div>
              )}

              {projects.length === 0 ? (
                <Card className="p-12 text-center card-interactive">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                    <Gamepad2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold font-display mb-2">Sem projetos ainda</h3>
                  <p className="text-muted-foreground mb-6">
                    Começa a tua jornada de desenvolvimento criando o teu primeiro projeto
                  </p>
                  <Button
                    onClick={handleNewProject}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Criar Projeto
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invitations */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold font-display">Convites</h2>
                {invitations.length > 0 && (
                  <span className="badge-premium">
                    {invitations.length}
                  </span>
                )}
              </div>

              {invitations.length === 0 ? (
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                    <Mail className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Sem convites pendentes</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onAccept={() => handleInvitationResponse(invitation.id, true)}
                      onDecline={() => handleInvitationResponse(invitation.id, false)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => navigate("/explore-projects")}
                >
                  <Compass className="w-5 h-5 text-secondary" />
                  Explorar Projetos
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => navigate("/friends")}
                >
                  <Users className="w-5 h-5 text-accent" />
                  Ver Amigos
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => navigate("/messages")}
                >
                  <Mail className="w-5 h-5 text-primary" />
                  Mensagens
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  FolderOpen, 
  FolderArchive, 
  Gamepad2, 
  Crown,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { ProjectCard } from "@/components/ProjectCard";
import { useUserPlan } from "@/hooks/useUserPlan";

interface Project {
  id: string;
  name: string;
  description: string;
  genre: string;
  image_url: string | null;
  status: string;
  methodology: string | null;
  created_at: string;
  owner_id: string;
}

const MyProjects = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { plan, limits, projectsCreatedThisMonth, canCreateProject } = useUserPlan();

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
    if (session) {
      loadProjects();
    }
  }, [session]);

  const loadProjects = async () => {
    try {
      // Get owned projects
      const { data: ownedProjects, error: ownedError } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", session?.user.id);

      if (ownedError) throw ownedError;

      // Get member projects
      const { data: memberProjectsData, error: memberError } = await supabase
        .from("project_members")
        .select("projects(*)")
        .eq("user_id", session?.user.id);

      if (memberError) throw memberError;

      const memberProjects = memberProjectsData?.map((item: any) => item.projects).filter(Boolean) || [];

      // Combine and deduplicate
      const allProjects = [...(ownedProjects || []), ...memberProjects];
      const uniqueProjects = Array.from(
        new Map(allProjects.map(p => [p.id, p])).values()
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setProjects(uniqueProjects);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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

  if (!session) return null;

  const activeProjects = projects.filter(p => p.status !== 'concluido');
  const completedProjects = projects.filter(p => p.status === 'concluido');

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary" />
            Meus Projetos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere todos os teus projetos de desenvolvimento de jogos
          </p>
        </div>
        <Button
          onClick={handleNewProject}
          className="bg-gradient-primary hover:opacity-90 gap-2 shadow-lg"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Novo Projeto
        </Button>
      </div>

      {/* Plan Limit Indicator */}
      {plan === 'freemium' && (
        <Card className="p-4 mb-8 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Plano Freemium</p>
                <p className="text-sm text-muted-foreground">
                  Projetos este mês: <strong>{projectsCreatedThisMonth}/{limits.maxProjectsPerMonth}</strong>
                </p>
              </div>
            </div>
            {!canCreateProject && (
              <Button 
                onClick={() => navigate('/pricing')} 
                size="sm"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Fazer Upgrade
              </Button>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold font-display mb-3">Sem projetos ainda</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Começa a tua jornada de desenvolvimento criando o teu primeiro projeto de jogo
          </p>
          <Button
            onClick={handleNewProject}
            className="bg-gradient-primary hover:opacity-90 gap-2"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Projeto
          </Button>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* Active Projects */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FolderOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold font-display">Em Andamento</h2>
              <Badge variant="secondary" className="ml-2">
                {activeProjects.length}
              </Badge>
            </div>
            
            {activeProjects.length === 0 ? (
              <Card className="p-8 text-center bg-muted/30">
                <p className="text-muted-foreground">
                  Nenhum projeto ativo no momento
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Completed Projects */}
          {completedProjects.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <FolderArchive className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold font-display">Histórico</h2>
                <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-700">
                  {completedProjects.length}
                </Badge>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default MyProjects;

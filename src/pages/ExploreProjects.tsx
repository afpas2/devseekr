import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { ProjectFilters } from "@/components/explore/ProjectFilters";
import { ProjectListCard } from "@/components/explore/ProjectListCard";
import { JoinRequestDialog } from "@/components/explore/JoinRequestDialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ExploreProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [userRequests, setUserRequests] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchUserRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchQuery, genreFilter, roleFilter, statusFilter]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          owner:profiles!projects_owner_id_fkey(full_name, avatar_url),
          members:project_members(count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedProjects = data.map((project: any) => ({
        ...project,
        owner: project.owner,
        member_count: project.members[0]?.count || 0,
      }));

      setProjects(mappedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRequests = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("project_join_requests")
        .select("project_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const requestedProjectIds = new Set(data.map((r) => r.project_id));
      setUserRequests(requestedProjectIds);
    } catch (error) {
      console.error("Error fetching user requests:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Genre filter
    if (genreFilter !== "all") {
      filtered = filtered.filter((p) => p.genre === genreFilter);
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(
        (p) =>
          p.looking_for_roles &&
          p.looking_for_roles.includes(roleFilter)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleRequestJoin = (project: any) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleRequestSuccess = () => {
    fetchUserRequests();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Explorar Projetos</h1>
          <p className="text-muted-foreground">
            Descubra projetos incríveis e junte-se a uma equipa de desenvolvimento.
          </p>
        </div>

        <ProjectFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          genreFilter={genreFilter}
          onGenreChange={setGenreFilter}
          roleFilter={roleFilter}
          onRoleChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum projeto encontrado com os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectListCard
                key={project.id}
                project={project}
                onViewDetails={() => navigate(`/project/${project.id}`)}
                onRequestJoin={() => handleRequestJoin(project)}
                hasRequested={userRequests.has(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <JoinRequestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
}

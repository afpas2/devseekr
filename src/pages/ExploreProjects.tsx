import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectFilters } from "@/components/explore/ProjectFilters";
import { ProjectListCard } from "@/components/explore/ProjectListCard";
import { JoinRequestDialog } from "@/components/explore/JoinRequestDialog";
import { ProjectDetailsDialog } from "@/components/explore/ProjectDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Compass, Search } from "lucide-react";

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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<any>(null);
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

  const handleViewDetails = (project: any) => {
    setSelectedProjectForDetails(project);
    setDetailsDialogOpen(true);
  };

  const handleRequestSuccess = () => {
    fetchUserRequests();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
              <Compass className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Explorar Projetos
            </h1>
          </div>
          <p className="text-muted-foreground ml-14">
            Descubra projetos incríveis e junte-se a uma equipa de desenvolvimento.
          </p>
        </div>

        {/* Filters */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
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
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">A carregar projetos...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="p-6 rounded-full bg-muted/50 mb-4">
              <Search className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground max-w-md">
              Não encontrámos projetos com os filtros aplicados. Tenta ajustar os filtros ou pesquisar por outra coisa.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project, index) => (
              <div 
                key={project.id} 
                className="animate-fade-in" 
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <ProjectListCard
                  project={project}
                  onViewDetails={() => handleViewDetails(project)}
                  onRequestJoin={() => handleRequestJoin(project)}
                  hasRequested={userRequests.has(project.id)}
                />
              </div>
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

      <ProjectDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        project={selectedProjectForDetails}
        hasRequested={selectedProjectForDetails ? userRequests.has(selectedProjectForDetails.id) : false}
        onRequestJoin={() => {
          if (selectedProjectForDetails) {
            handleRequestJoin(selectedProjectForDetails);
          }
        }}
      />
    </div>
  );
}

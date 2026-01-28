import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MemberReviewForm } from "@/components/review/MemberReviewForm";
import { Loader2, CheckCircle, Gamepad2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  name: string;
  image_url: string | null;
  status: string;
}

interface MemberData {
  id: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

type WizardState = "intro" | "reviewing" | "complete";

const ProjectReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardState, setWizardState] = useState<WizardState>("intro");
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session && id) {
      loadProjectAndMembers();
    }
  }, [session, id]);

  const loadProjectAndMembers = async () => {
    try {
      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, name, image_url, status")
        .eq("id", id)
        .single();

      if (projectError) throw projectError;

      if (projectData.status !== "concluido") {
        toast.error("Este projeto ainda não foi concluído.");
        navigate(`/projects/${id}`);
        return;
      }

      setProject(projectData);

      // Load all members (including owner via project_members or as owner)
      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select(`
          id,
          user_id,
          profiles(username, full_name, avatar_url)
        `)
        .eq("project_id", id);

      if (membersError) throw membersError;

      // Get project owner
      const { data: projectWithOwner } = await supabase
        .from("projects")
        .select("owner_id, profiles:owner_id(username, full_name, avatar_url)")
        .eq("id", id)
        .single();

      // Combine members and owner, filter out current user
      let allMembers: MemberData[] = membersData?.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        profiles: m.profiles,
      })) || [];

      // Add owner if not already in members list
      if (
        projectWithOwner &&
        !allMembers.some((m) => m.user_id === projectWithOwner.owner_id)
      ) {
        allMembers.push({
          id: `owner-${projectWithOwner.owner_id}`,
          user_id: projectWithOwner.owner_id,
          profiles: projectWithOwner.profiles as any,
        });
      }

      // Filter out current user and already reviewed members
      const { data: existingReviews } = await supabase
        .from("reviews")
        .select("reviewee_id")
        .eq("project_id", id)
        .eq("reviewer_id", session!.user.id);

      const reviewedUserIds =
        existingReviews?.map((r) => r.reviewee_id) || [];

      const membersToReview = allMembers.filter(
        (m) =>
          m.user_id !== session!.user.id &&
          !reviewedUserIds.includes(m.user_id)
      );

      if (membersToReview.length === 0) {
        toast.info("Já avaliaste todos os membros deste projeto.");
        navigate("/dashboard");
        return;
      }

      setMembers(membersToReview);
    } catch (error: any) {
      console.error("Error loading project:", error);
      toast.error("Erro ao carregar projeto.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (formData: any) => {
    if (!session || !project) return;

    setIsSubmitting(true);
    try {
      const currentMember = members[currentMemberIndex];

      const { error } = await supabase.from("reviews").insert({
        project_id: project.id,
        reviewer_id: session.user.id,
        reviewee_id: currentMember.user_id,
        rating_overall: formData.rating_overall,
        metrics: formData.metrics,
        would_work_again: formData.would_work_again,
        recommend: formData.recommend,
        role_played: formData.role_played || null,
        commitment_level: formData.commitment_level || null,
        comment: formData.comment || null,
        flags: formData.flags,
      });

      if (error) throw error;

      if (currentMemberIndex < members.length - 1) {
        setCurrentMemberIndex((prev) => prev + 1);
      } else {
        setWizardState("complete");
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error("Erro ao guardar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  const progress =
    wizardState === "complete"
      ? 100
      : wizardState === "intro"
      ? 0
      : ((currentMemberIndex + 1) / members.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-3xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/projects/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Projeto
        </Button>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {wizardState === "intro"
              ? "Bem-vindo"
              : wizardState === "complete"
              ? "Concluído"
              : `Membro ${currentMemberIndex + 1} de ${members.length}`}
          </p>
        </div>

        {/* Intro Screen */}
        {wizardState === "intro" && (
          <Card className="p-8 text-center animate-fade-in">
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-6">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex items-center justify-center">
                  <Gamepad2 className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h2 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                {project.name}
              </h2>
            </div>

            <h1 className="text-2xl font-bold mb-3">
              O projeto terminou. Como correu a colaboração?
            </h1>
            <p className="text-muted-foreground mb-6">
              Avalia cada membro da equipa para ajudar outros developers a
              encontrar bons colaboradores.
            </p>

            <Button
              onClick={() => setWizardState("reviewing")}
              className="px-8 bg-gradient-primary hover:opacity-90"
            >
              Começar Avaliação
            </Button>
          </Card>
        )}

        {/* Reviewing Screen */}
        {wizardState === "reviewing" && members[currentMemberIndex] && (
          <div className="animate-fade-in">
            <MemberReviewForm
              member={members[currentMemberIndex]}
              currentIndex={currentMemberIndex}
              totalMembers={members.length}
              onSubmit={handleSubmitReview}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Complete Screen */}
        {wizardState === "complete" && (
          <Card className="p-12 text-center animate-fade-in">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-3">Obrigado!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              As tuas avaliações foram guardadas com sucesso. Obrigado por
              contribuíres para a comunidade!
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="px-8 bg-gradient-primary hover:opacity-90"
            >
              Voltar à Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectReview;

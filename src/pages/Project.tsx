import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TeamMember } from "@/components/TeamMember";
import { MatchDialog } from "@/components/MatchDialog";

interface ProjectData {
  id: string;
  name: string;
  description: string;
  genre: string;
  image_url: string | null;
  status: string;
  owner_id: string;
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

  if (!session || loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOwner = project.owner_id === session.user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

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
                <Badge variant="secondary">{project.status}</Badge>
              </div>
              <Badge className="bg-gradient-primary mb-4">{project.genre}</Badge>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          </div>
        </Card>

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
      </div>

      <MatchDialog
        open={showMatchDialog}
        onOpenChange={setShowMatchDialog}
        projectId={id!}
        onInviteSent={() => {
          setShowMatchDialog(false);
          toast.success("Invitation sent!");
        }}
      />
    </div>
  );
};

export default Project;

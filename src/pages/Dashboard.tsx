import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, LogOut, Mail, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { ProjectCard } from "@/components/ProjectCard";
import { InvitationCard } from "@/components/InvitationCard";

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
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", session?.user.id)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load invitations
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) return;

      // Update invitation status
      const { error: updateError } = await supabase
        .from("project_invitations")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      if (accept) {
        // Add user to project members
        const { error: memberError } = await supabase
          .from("project_members")
          .insert({
            project_id: invitation.project_id,
            user_id: session?.user.id,
            role: "Member",
          });

        if (memberError) throw memberError;
      }

      toast.success(accept ? "Invitation accepted!" : "Invitation declined");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!session || loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Devseekr
            </h1>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Projects</h2>
                <Button
                  onClick={() => navigate("/projects/new")}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </div>

              {projects.length === 0 ? (
                <Card className="p-12 text-center">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your game development journey by creating your first project
                  </p>
                  <Button
                    onClick={() => navigate("/projects/new")}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Create Project
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
                <Mail className="w-5 h-5" />
                <h2 className="text-xl font-bold">Invitations</h2>
                {invitations.length > 0 && (
                  <span className="bg-gradient-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {invitations.length}
                  </span>
                )}
              </div>

              {invitations.length === 0 ? (
                <Card className="p-6 text-center">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No pending invitations</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

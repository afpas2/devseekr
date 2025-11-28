import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface JoinRequest {
  id: string;
  user_id: string;
  message: string | null;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

interface ProjectJoinRequestsProps {
  projectId: string;
  onRequestsChange: () => void;
}

export const ProjectJoinRequests = ({ projectId, onRequestsChange }: ProjectJoinRequestsProps) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('join-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_join_requests',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("project_join_requests")
        .select(`
          *,
          profiles(username, full_name)
        `)
        .eq("project_id", projectId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error loading join requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, userId: string) => {
    setProcessingId(requestId);
    try {
      // First, get the user's roles from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      // Use the first role or default to the role from the request
      const role = userRoles && userRoles.length > 0 ? userRoles[0].role : "Member";

      // Add user to project_members
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: userId,
          role: role
        });

      if (memberError) throw memberError;

      // Update request status
      const { error: updateError } = await supabase
        .from("project_join_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Get project name and send notification to the user
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      if (project) {
        await supabase.from("notifications").insert({
          recipient_id: userId,
          type: "join_request_accepted",
          message: `O teu pedido para entrar em ${project.name} foi aceite!`,
          project_id: projectId,
        });
      }

      toast.success("Pedido aceite com sucesso!");
      onRequestsChange();
      loadRequests();
    } catch (error: any) {
      toast.error("Erro ao aceitar pedido: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string, userId: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from("project_join_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      // Get project name and send notification to the user
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      if (project) {
        await supabase.from("notifications").insert({
          recipient_id: userId,
          type: "join_request_rejected",
          message: `O teu pedido para entrar em ${project.name} foi rejeitado`,
          project_id: projectId,
        });
      }

      toast.success("Pedido rejeitado");
      loadRequests();
    } catch (error: any) {
      toast.error("Erro ao rejeitar pedido: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return null;
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Pedidos de Entrada
        </CardTitle>
        <CardDescription>
          {requests.length} {requests.length === 1 ? "pedido pendente" : "pedidos pendentes"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-start gap-4 p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
          >
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {request.profiles.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">{request.profiles.full_name}</p>
                <span className="text-sm text-muted-foreground">@{request.profiles.username}</span>
              </div>
              {request.message && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {request.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(request.created_at).toLocaleDateString('pt-PT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleAccept(request.id, request.user_id)}
                disabled={processingId === request.id}
                className="bg-gradient-primary"
              >
                <Check className="w-4 h-4 mr-1" />
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(request.id, request.user_id)}
                disabled={processingId === request.id}
              >
                <X className="w-4 h-4 mr-1" />
                Rejeitar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

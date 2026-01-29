import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, UserPlus, Crown, Star } from "lucide-react";
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
  isPremium?: boolean;
  averageRating?: number;
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

      // Fetch premium status and ratings for each user
      const userIds = data?.map(r => r.user_id) || [];
      
      // Get subscriptions
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan, status, expires_at")
        .in("user_id", userIds);

      // Get reviews for ratings
      const { data: reviews } = await supabase
        .from("reviews")
        .select("reviewee_id, rating_overall")
        .in("reviewee_id", userIds);

      // Calculate average ratings by user
      const ratingsByUser = new Map<string, number[]>();
      reviews?.forEach(r => {
        const existing = ratingsByUser.get(r.reviewee_id) || [];
        existing.push(r.rating_overall);
        ratingsByUser.set(r.reviewee_id, existing);
      });

      // Create premium lookup
      const premiumUsers = new Set<string>();
      subscriptions?.forEach(sub => {
        const isActive = sub.status === 'active';
        const isNotExpired = !sub.expires_at || new Date(sub.expires_at) > new Date();
        if (isActive && isNotExpired && sub.plan === 'premium') {
          premiumUsers.add(sub.user_id);
        }
      });

      // Enrich requests with premium status and ratings
      const enrichedRequests = (data || []).map(req => ({
        ...req,
        isPremium: premiumUsers.has(req.user_id),
        averageRating: ratingsByUser.has(req.user_id)
          ? ratingsByUser.get(req.user_id)!.reduce((a, b) => a + b, 0) / ratingsByUser.get(req.user_id)!.length
          : 0,
      }));

      // Sort: Premium first, then by date
      const sortedRequests = enrichedRequests.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setRequests(sortedRequests);
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
            className={`flex items-start gap-4 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors ${
              request.isPremium 
                ? 'border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5' 
                : 'border-border'
            }`}
          >
            <div className={`relative ${request.isPremium ? 'p-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500' : ''}`}>
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {request.profiles.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-semibold">{request.profiles.full_name}</p>
                <span className="text-sm text-muted-foreground">@{request.profiles.username}</span>
                {request.isPremium && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    PRO
                  </Badge>
                )}
                {request.averageRating > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{request.averageRating.toFixed(1)}</span>
                  </div>
                )}
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

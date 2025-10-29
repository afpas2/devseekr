import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

interface MatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onInviteSent: () => void;
}

export const MatchDialog = ({
  open,
  onOpenChange,
  projectId,
  onInviteSent,
}: MatchDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const [projectContext, setProjectContext] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const handleFindMatch = async () => {
    if (!projectContext.trim()) {
      toast.error("Please provide project context");
      return;
    }

    setMatching(true);

    try {
      const { data, error } = await supabase.functions.invoke("find-team-match", {
        body: {
          projectId,
          projectContext,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setMatchData(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to find match");
    } finally {
      setMatching(false);
    }
  };

  const handleSendInvite = async () => {
    if (!matchData) return;

    setLoading(true);

    try {
      const session = await supabase.auth.getSession();
      const { error } = await supabase.from("project_invitations").insert({
        project_id: projectId,
        sender_id: session.data.session?.user.id,
        recipient_id: matchData.userId,
        message: inviteMessage,
      });

      if (error) throw error;

      onInviteSent();
      setMatchData(null);
      setProjectContext("");
      setInviteMessage("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setMatchData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Find Team Member with AI
          </DialogTitle>
          <DialogDescription>
            Describe what you need and we'll find the perfect match
          </DialogDescription>
        </DialogHeader>

        {!matchData ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Context</Label>
              <Textarea
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
                placeholder="Describe your project stage, what's done, what needs to be done, and what skills you're looking for..."
                rows={6}
              />
            </div>

            <Button
              onClick={handleFindMatch}
              disabled={matching}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {matching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding match...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find Match
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Match Profile */}
            <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-16 h-16 bg-gradient-primary">
                  <AvatarFallback className="bg-transparent text-primary-foreground text-xl">
                    {matchData.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{matchData.username}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {matchData.fullName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchData.roles?.map((role: string) => (
                      <Badge key={role} className="bg-gradient-primary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {matchData.bio && (
                <p className="text-sm text-muted-foreground mb-4">{matchData.bio}</p>
              )}

              <div className="p-4 bg-card rounded-md">
                <h4 className="font-semibold mb-2 text-sm">Why this match?</h4>
                <p className="text-sm text-muted-foreground">{matchData.reasoning}</p>
              </div>
            </div>

            {/* Invite Message */}
            <div className="space-y-2">
              <Label>Invitation Message (optional)</Label>
              <Textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleSendInvite}
                disabled={loading}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Send Invitation
              </Button>
              <Button onClick={handleSkip} variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Skip
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

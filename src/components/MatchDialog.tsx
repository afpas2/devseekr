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
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DraftCandidateCard, type DraftCandidate } from "@/components/match/DraftCandidateCard";

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
  const [candidates, setCandidates] = useState<DraftCandidate[] | null>(null);
  const [projectContext, setProjectContext] = useState("");
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const handleFindMatch = async () => {
    if (!projectContext.trim()) {
      toast.error("Descreve o contexto do projeto");
      return;
    }

    setMatching(true);

    try {
      const { data, error } = await supabase.functions.invoke("find-team-match", {
        body: { projectId, projectContext },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Ensure we have an array
      const candidateList = Array.isArray(data) ? data : [data];
      setCandidates(candidateList);
    } catch (error: any) {
      toast.error(error.message || "Falha ao encontrar matches");
    } finally {
      setMatching(false);
    }
  };

  const handleInvite = async (candidate: DraftCandidate) => {
    setInvitingId(candidate.userId);

    try {
      const session = await supabase.auth.getSession();
      const { error } = await supabase.from("project_invitations").insert({
        project_id: projectId,
        sender_id: session.data.session?.user.id,
        recipient_id: candidate.userId,
        message: `Convite via AI Match - ${candidate.highlight || "Match recomendado"}`,
      });

      if (error) throw error;

      toast.success(`Convite enviado para ${candidate.username}!`);
      onInviteSent();
      setCandidates(null);
      setProjectContext("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setInvitingId(null);
    }
  };

  const handleReset = () => {
    setCandidates(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={candidates ? "max-w-5xl" : "max-w-2xl"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {candidates ? "Candidatos Sugeridos" : "Encontrar Membro com IA"}
          </DialogTitle>
          <DialogDescription>
            {candidates
              ? "Compara os candidatos e escolhe o melhor fit para a tua equipa"
              : "Descreve o que precisas e vamos encontrar os melhores matches"}
          </DialogDescription>
        </DialogHeader>

        {!candidates ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contexto do Projeto</Label>
              <Textarea
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
                placeholder="Descreve a fase do projeto, o que está feito, o que falta, e que skills procuras..."
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
                  A procurar matches...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Encontrar Matches
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Draft Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {candidates.map((candidate, idx) => (
                <DraftCandidateCard
                  key={candidate.userId || idx}
                  candidate={candidate}
                  onInvite={handleInvite}
                  loading={invitingId === candidate.userId}
                />
              ))}
            </div>

            {/* Reset */}
            <Button onClick={handleReset} variant="outline" className="w-full">
              Procurar Novos Candidatos
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

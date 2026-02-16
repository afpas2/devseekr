import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, UserPlus, Loader2, Trophy } from "lucide-react";

export interface DraftCandidate {
  userId: string;
  username: string;
  fullName: string;
  roles: string[];
  bio?: string;
  avgRating: number;
  matchScore: number;
  reasoning: string;
  highlight: string;
  completedProjects?: string[];
}

interface DraftCandidateCardProps {
  candidate: DraftCandidate;
  onInvite: (candidate: DraftCandidate) => void;
  loading: boolean;
}

const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`w-4 h-4 ${i <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
      />
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
};

export const DraftCandidateCard = ({ candidate, onInvite, loading }: DraftCandidateCardProps) => {
  return (
    <div className="relative group p-5 rounded-2xl border-2 border-border bg-gradient-to-br from-card to-muted/30 hover:border-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Highlight badge */}
      {candidate.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-primary text-xs whitespace-nowrap shadow-md">
            ✨ {candidate.highlight}
          </Badge>
        </div>
      )}

      {/* Avatar + Name */}
      <div className="flex flex-col items-center text-center mt-2 mb-4">
        <Avatar className="w-16 h-16 mb-3 bg-gradient-primary ring-2 ring-primary/20">
          <AvatarFallback className="bg-transparent text-primary-foreground text-xl font-bold">
            {candidate.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-bold text-lg leading-tight">{candidate.username}</h3>
        <p className="text-sm text-muted-foreground">{candidate.fullName}</p>
      </div>

      {/* Rating */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <StarRating rating={candidate.avgRating} />
        <span className="text-sm font-medium">{candidate.avgRating.toFixed(1)}</span>
      </div>

      {/* Match Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Match Score</span>
          <span className="text-sm font-bold text-primary">{Math.round(candidate.matchScore)}%</span>
        </div>
        <Progress value={candidate.matchScore} className="h-2" />
      </div>

      {/* Roles */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        {candidate.roles?.slice(0, 4).map((role) => (
          <Badge key={role} variant="outline" className="text-xs">
            {role}
          </Badge>
        ))}
      </div>

      {/* Completed Projects */}
      {candidate.completedProjects && candidate.completedProjects.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Projetos Concluídos</span>
          </div>
          <div className="space-y-1">
            {candidate.completedProjects.slice(0, 3).map((p, i) => (
              <p key={i} className="text-xs text-foreground/80 truncate">• {p}</p>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      <div className="flex-1 mb-4">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {candidate.reasoning}
        </p>
      </div>

      {/* Invite Button */}
      <Button
        onClick={() => onInvite(candidate)}
        disabled={loading}
        className="w-full bg-gradient-primary hover:opacity-90"
        size="sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <UserPlus className="w-4 h-4 mr-1" />
        )}
        Convidar
      </Button>
    </div>
  );
};

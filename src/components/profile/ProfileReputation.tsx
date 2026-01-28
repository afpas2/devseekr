import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "@/components/review/StarRating";
import { Star, Award, ThumbsUp, UserCheck } from "lucide-react";

interface ReviewData {
  rating_overall: number;
  metrics: {
    deadlines?: number;
    quality?: number;
    communication?: number;
    teamwork?: number;
    professionalism?: number;
    problem_solving?: number;
  } | null;
  would_work_again: boolean | null;
  recommend: boolean | null;
}

interface ProfileReputationProps {
  reviews: ReviewData[];
}

const BADGE_CONFIG: Record<string, { metric: string; label: string; icon: string }> = {
  communication: { metric: "communication", label: "Comunicador Top", icon: "💬" },
  deadlines: { metric: "deadlines", label: "Sempre Pontual", icon: "⏰" },
  quality: { metric: "quality", label: "Qualidade Premium", icon: "✨" },
  teamwork: { metric: "teamwork", label: "Espírito de Equipa", icon: "🤝" },
  professionalism: { metric: "professionalism", label: "Profissional", icon: "💼" },
  problem_solving: { metric: "problem_solving", label: "Solucionador", icon: "🧩" },
};

const METRIC_LABELS: Record<string, string> = {
  communication: "Comunicação",
  teamwork: "Trabalho em Equipa",
  deadlines: "Cumprimento de Prazos",
  quality: "Qualidade",
  professionalism: "Profissionalismo",
  problem_solving: "Resolução de Problemas",
};

export const ProfileReputation = ({ reviews }: ProfileReputationProps) => {
  if (reviews.length === 0) {
    return null;
  }

  // Calculate average overall rating
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length;

  // Calculate metric averages
  const metricSums: Record<string, { total: number; count: number }> = {};
  
  reviews.forEach((review) => {
    if (review.metrics) {
      Object.entries(review.metrics).forEach(([key, value]) => {
        if (typeof value === "number") {
          if (!metricSums[key]) {
            metricSums[key] = { total: 0, count: 0 };
          }
          metricSums[key].total += value;
          metricSums[key].count += 1;
        }
      });
    }
  });

  const avgMetrics: Record<string, number> = {};
  Object.entries(metricSums).forEach(([key, { total, count }]) => {
    avgMetrics[key] = count > 0 ? total / count : 0;
  });

  // Calculate badges (metric >= 4.5)
  const earnedBadges = Object.entries(BADGE_CONFIG)
    .filter(([, config]) => avgMetrics[config.metric] >= 4.5)
    .map(([, config]) => config);

  // Calculate would work again and recommend percentages
  const wouldWorkAgainCount = reviews.filter((r) => r.would_work_again === true).length;
  const recommendCount = reviews.filter((r) => r.recommend === true).length;
  const wouldWorkAgainTotal = reviews.filter((r) => r.would_work_again !== null).length;
  const recommendTotal = reviews.filter((r) => r.recommend !== null).length;

  const wouldWorkAgainPercent =
    wouldWorkAgainTotal > 0
      ? Math.round((wouldWorkAgainCount / wouldWorkAgainTotal) * 100)
      : 0;
  const recommendPercent =
    recommendTotal > 0
      ? Math.round((recommendCount / recommendTotal) * 100)
      : 0;

  return (
    <Card className="p-6 space-y-5 border-border/50 hover:border-primary/10 transition-colors animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="font-semibold text-foreground">Reputação</h3>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/10">
        <div className="flex items-center gap-2">
          <StarRating value={Math.round(avgRating)} readonly size="md" />
        </div>
        <div>
          <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground ml-2">
            ({reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"})
          </span>
        </div>
      </div>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Award className="w-4 h-4" />
            Badges
          </div>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge) => (
              <Badge
                key={badge.metric}
                variant="secondary"
                className="gap-1.5 py-1.5 px-3"
              >
                <span>{badge.icon}</span>
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {Object.keys(avgMetrics).length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Métricas</p>
          <div className="space-y-2">
            {Object.entries(avgMetrics).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{METRIC_LABELS[key] || key}</span>
                  <span className="font-medium">{value.toFixed(1)}</span>
                </div>
                <Progress value={(value / 5) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compatibility Stats */}
      <div className="grid grid-cols-2 gap-3">
        {wouldWorkAgainTotal > 0 && (
          <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <ThumbsUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{wouldWorkAgainPercent}%</p>
              <p className="text-xs text-muted-foreground">voltariam a trabalhar</p>
            </div>
          </div>
        )}
        {recommendTotal > 0 && (
          <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{recommendPercent}%</p>
              <p className="text-xs text-muted-foreground">recomendam</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquare, Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  project: {
    id: string;
    name: string;
  } | null;
}

interface ProfileReviewsProps {
  reviews: Review[];
  averageRating: number;
}

export const ProfileReviews = ({
  reviews,
  averageRating,
}: ProfileReviewsProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-muted text-muted"
        }`}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (reviews.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 space-y-5 border-border/50 hover:border-primary/10 transition-colors animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="font-semibold text-foreground">Reviews</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-0.5">
            {renderStars(Math.round(averageRating))}
          </div>
          <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({reviews.length})
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div 
            key={review.id} 
            className="group p-4 rounded-xl border border-border/50 hover:border-primary/20 hover:bg-muted/30 transition-all"
          >
            <div className="flex items-start gap-4">
              <Link to={`/profile/${review.reviewer.id}`}>
                <Avatar className="w-11 h-11 ring-2 ring-transparent group-hover:ring-primary/20 transition-all cursor-pointer">
                  <AvatarImage src={review.reviewer.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm">
                    {getInitials(review.reviewer.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <Link 
                      to={`/profile/${review.reviewer.id}`}
                      className="font-semibold text-sm hover:text-primary transition-colors"
                    >
                      {review.reviewer.full_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      @{review.reviewer.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {renderStars(review.rating)}
                  </div>
                </div>
                
                {review.comment && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/30">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {review.project && (
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                      <Folder className="w-3 h-3" />
                      {review.project.name}
                    </span>
                  )}
                  <span>
                    {formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground font-semibold">Reviews</h3>
          <div className="flex items-center gap-1">
            {renderStars(Math.round(averageRating))}
            <span className="ml-2 text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={review.reviewer.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(review.reviewer.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {review.reviewer.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{review.reviewer.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-foreground">
                    {review.comment}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {review.project && (
                    <>
                      <span>📁 {review.project.name}</span>
                      <span>•</span>
                    </>
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

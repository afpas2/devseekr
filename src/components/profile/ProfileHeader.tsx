import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Star, Crown, MapPin, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileHeaderProps {
  profile: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    country: string;
  };
  isOwnProfile: boolean;
  isPremium?: boolean;
  averageRating?: number;
  totalReviews?: number;
  completedProjects?: number;
  onLeaveReview?: () => void;
}

export const ProfileHeader = ({
  profile,
  isOwnProfile,
  isPremium = false,
  averageRating = 0,
  totalReviews = 0,
  completedProjects = 0,
  onLeaveReview,
}: ProfileHeaderProps) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = () => {
    navigate(`/messages?user=${profile.id}`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.round(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "fill-muted text-muted"
        }`}
      />
    ));
  };

  // Array of cover gradients for users without custom covers
  const coverGradients = [
    'from-blue-600/30 via-purple-500/20 to-pink-500/30',
    'from-green-500/30 via-teal-500/20 to-cyan-500/30',
    'from-orange-500/30 via-red-500/20 to-pink-500/30',
    'from-indigo-600/30 via-blue-500/20 to-cyan-500/30',
    'from-rose-500/30 via-fuchsia-500/20 to-violet-500/30',
  ];

  // Generate a consistent gradient based on the user's ID
  const gradientIndex = profile.id.charCodeAt(0) % coverGradients.length;
  const selectedGradient = coverGradients[gradientIndex];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card animate-fade-in">
      {/* Cover Gradient - Increased height */}
      <div className={`h-40 md:h-48 bg-gradient-to-br ${selectedGradient} relative`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/50 via-transparent to-transparent" />
        {isPremium && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
              <Crown className="w-3.5 h-3.5 mr-1" />
              PRO
            </Badge>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <div className={`relative inline-block ${isPremium ? 'p-1 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400' : ''}`}>
            <Avatar className="w-28 h-28 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
            </div>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-foreground leading-relaxed max-w-2xl">{profile.bio}</p>
          )}

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.country}</span>
            </Badge>
            
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-0.5">
                  {renderStars(averageRating)}
                </div>
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({totalReviews})
                </span>
              </div>
            )}
            
            {completedProjects > 0 && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                <Briefcase className="w-3.5 h-3.5" />
                {completedProjects}{" "}
                {completedProjects === 1 ? "projeto" : "projetos"}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button 
                onClick={handleSendMessage} 
                className="gap-2 bg-gradient-primary hover:opacity-90 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar Mensagem
              </Button>
              <Button variant="outline" className="gap-2 hover:bg-primary/5">
                <Mail className="w-4 h-4" />
                Convidar para Projeto
              </Button>
              {onLeaveReview && (
                <Button 
                  variant="outline" 
                  onClick={onLeaveReview} 
                  className="gap-2 hover:bg-yellow-500/10 hover:border-yellow-500/30 hover:text-yellow-700 dark:hover:text-yellow-400"
                >
                  <Star className="w-4 h-4" />
                  Deixar Review
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

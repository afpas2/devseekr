import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Gamepad2, Heart, ThumbsDown, Palette } from "lucide-react";

interface ProfileGamesProps {
  favoriteGames: Array<{ game_name: string }>;
  likedGenres: Array<{ genre: string }>;
  dislikedGenres: Array<{ genre: string }>;
  aesthetics: Array<{ aesthetic: string; preference: string }>;
}

export const ProfileGames = ({
  favoriteGames,
  likedGenres,
  dislikedGenres,
  aesthetics,
}: ProfileGamesProps) => {
  const hasContent =
    favoriteGames.length > 0 ||
    likedGenres.length > 0 ||
    dislikedGenres.length > 0 ||
    aesthetics.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="p-6 space-y-6 border-border/50 hover:border-primary/10 transition-colors animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <Gamepad2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="font-semibold text-foreground">Preferências de Jogos</h3>
      </div>

      {favoriteGames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Gamepad2 className="w-4 h-4" />
            <span>Jogos Favoritos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {favoriteGames.map((game, index) => (
              <Badge 
                key={index} 
                className="bg-gradient-primary text-primary-foreground border-0 shadow-sm"
              >
                {game.game_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {likedGenres.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Géneros Favoritos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {likedGenres.map((genre, index) => (
              <Badge 
                key={index} 
                className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
              >
                {genre.genre}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {dislikedGenres.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ThumbsDown className="w-4 h-4" />
            <span>Géneros Menos Preferidos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dislikedGenres.map((genre, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-muted-foreground border-border/50"
              >
                {genre.genre}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {aesthetics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Palette className="w-4 h-4 text-violet-500" />
            <span>Estéticas Preferidas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aesthetics.map((aes, index) => (
              <Badge 
                key={index} 
                className="bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20"
              >
                {aes.aesthetic} • {aes.preference}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

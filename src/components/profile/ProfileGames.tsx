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
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Preferências de Jogos</h3>

      {favoriteGames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Gamepad2 className="w-4 h-4" />
            <span>Jogos Favoritos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {favoriteGames.map((game, index) => (
              <Badge key={index} variant="secondary" className="bg-gradient-primary text-primary-foreground">
                {game.game_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {likedGenres.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Heart className="w-4 h-4" />
            <span>Gêneros Favoritos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {likedGenres.map((genre, index) => (
              <Badge key={index} className="bg-primary/10 text-primary border-primary/20">
                {genre.genre}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {dislikedGenres.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <ThumbsDown className="w-4 h-4" />
            <span>Gêneros Não Preferidos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dislikedGenres.map((genre, index) => (
              <Badge key={index} variant="outline" className="text-muted-foreground">
                {genre.genre}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {aesthetics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Palette className="w-4 h-4" />
            <span>Estéticas Preferidas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aesthetics.map((aes, index) => (
              <Badge key={index} variant="secondary">
                {aes.aesthetic} - {aes.preference}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

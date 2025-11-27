import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle } from "lucide-react";
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
}

export const ProfileHeader = ({ profile, isOwnProfile }: ProfileHeaderProps) => {
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

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
      <div className="flex flex-col md:flex-row gap-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{profile.full_name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-foreground leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-xl">{profile.country}</span>
              <span>{profile.country}</span>
            </Badge>
          </div>

          {!isOwnProfile && (
            <div className="flex gap-2">
              <Button onClick={handleSendMessage} className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Enviar Mensagem
              </Button>
              <Button variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                Convidar para Projeto
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

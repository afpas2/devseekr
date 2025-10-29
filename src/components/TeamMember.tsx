import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TeamMemberProps {
  member: {
    role: string;
    profiles: {
      username: string;
      full_name: string;
    };
  };
}

export const TeamMember = ({ member }: TeamMemberProps) => {
  return (
    <Card className="p-4 flex items-center gap-3">
      <Avatar className="w-12 h-12 bg-gradient-primary">
        <AvatarFallback className="bg-transparent text-primary-foreground">
          {member.profiles.full_name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{member.profiles.full_name}</p>
        <p className="text-sm text-muted-foreground truncate">
          @{member.profiles.username}
        </p>
      </div>
      <Badge variant="secondary">{member.role}</Badge>
    </Card>
  );
};

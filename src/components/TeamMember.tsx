import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface TeamMemberProps {
  member: {
    role: string;
    user_id: string;
    profiles: {
      username: string;
      full_name: string;
    };
  };
}

export const TeamMember = ({ member }: TeamMemberProps) => {
  return (
    <Card className="p-4 flex items-center gap-3">
      <Link to={`/profile/${member.user_id}`}>
        <Avatar className="w-12 h-12 bg-gradient-primary cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarFallback className="bg-transparent text-primary-foreground">
            {member.profiles.full_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${member.user_id}`} className="hover:underline">
          <p className="font-semibold truncate">{member.profiles.full_name}</p>
        </Link>
        <p className="text-sm text-muted-foreground truncate">
          @{member.profiles.username}
        </p>
      </div>
      <Badge variant="secondary">{member.role}</Badge>
    </Card>
  );
};

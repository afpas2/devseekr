import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Crown, Code, Palette, Music, FileText, Gamepad2 } from "lucide-react";

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

const getRoleConfig = (role: string) => {
  const roleLower = role.toLowerCase();
  
  if (roleLower === 'owner') {
    return { icon: Crown, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
  }
  if (roleLower.includes('program') || roleLower.includes('dev')) {
    return { icon: Code, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
  }
  if (roleLower.includes('art') || roleLower.includes('design')) {
    return { icon: Palette, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
  }
  if (roleLower.includes('sound') || roleLower.includes('music')) {
    return { icon: Music, color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' };
  }
  if (roleLower.includes('write') || roleLower.includes('story')) {
    return { icon: FileText, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  }
  return { icon: Gamepad2, color: 'bg-primary/10 text-primary border-primary/20' };
};

export const TeamMember = ({ member }: TeamMemberProps) => {
  const roleConfig = getRoleConfig(member.role);
  const RoleIcon = roleConfig.icon;

  return (
    <Card className="p-4 flex items-center gap-4 border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-300 group animate-fade-in">
      <Link to={`/profile/${member.user_id}`} className="flex-shrink-0">
        <Avatar className="w-12 h-12 bg-gradient-to-br from-primary to-secondary cursor-pointer ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
          <AvatarFallback className="bg-transparent text-primary-foreground font-semibold">
            {member.profiles.full_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link 
          to={`/profile/${member.user_id}`} 
          className="hover:text-primary transition-colors"
        >
          <p className="font-semibold truncate group-hover:text-primary transition-colors">
            {member.profiles.full_name}
          </p>
        </Link>
        <p className="text-sm text-muted-foreground truncate">
          @{member.profiles.username}
        </p>
      </div>
      
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1.5 ${roleConfig.color} border`}
      >
        <RoleIcon className="w-3.5 h-3.5" />
        <span>{member.role}</span>
      </Badge>
    </Card>
  );
};

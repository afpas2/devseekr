import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Code, Languages } from "lucide-react";

interface ProfileSkillsProps {
  roles: Array<{ role: string }>;
  languages: Array<{ language: string }>;
}

export const ProfileSkills = ({ roles, languages }: ProfileSkillsProps) => {
  if (roles.length === 0 && languages.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 space-y-6">
      {roles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Code className="w-5 h-5" />
            <h3>Skills & Roles</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((role, index) => (
              <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                {role.role}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {languages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Languages className="w-5 h-5" />
            <h3>Idiomas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang, index) => (
              <Badge key={index} variant="outline">
                {lang.language}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

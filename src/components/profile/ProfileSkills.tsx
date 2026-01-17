import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Code, Languages, Sparkles } from "lucide-react";

interface ProfileSkillsProps {
  roles: Array<{ role: string }>;
  languages: Array<{ language: string }>;
}

export const ProfileSkills = ({ roles, languages }: ProfileSkillsProps) => {
  if (roles.length === 0 && languages.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 space-y-6 border-border/50 hover:border-primary/10 transition-colors animate-fade-in">
      {roles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <Code className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Skills & Funções</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((role, index) => (
              <Badge 
                key={index} 
                className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 hover:from-primary/20 hover:to-primary/10 transition-colors cursor-default"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                {role.role}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {languages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-foreground">Idiomas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-300"
              >
                {lang.language}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

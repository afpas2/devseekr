import { Card } from "@/components/ui/card";
import { ProjectCard } from "@/components/ProjectCard";
import { Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileProjectsProps {
  projects: Array<{
    id: string;
    name: string;
    description: string;
    genre: string;
    image_url: string | null;
    status: string;
  }>;
}

export const ProfileProjects = ({ projects }: ProfileProjectsProps) => {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 text-foreground font-semibold">
        <Briefcase className="w-5 h-5" />
        <h3>Projetos</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => navigate(`/project/${project.id}`)}
          />
        ))}
      </div>
    </Card>
  );
};

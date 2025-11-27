import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSkills } from "@/components/profile/ProfileSkills";
import { ProfileGames } from "@/components/profile/ProfileGames";
import { ProfileProjects } from "@/components/profile/ProfileProjects";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<any[]>([]);
  const [likedGenres, setLikedGenres] = useState<any[]>([]);
  const [dislikedGenres, setDislikedGenres] = useState<any[]>([]);
  const [aesthetics, setAesthetics] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch roles
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", id);
        setRoles(rolesData || []);

        // Fetch languages
        const { data: languagesData } = await supabase
          .from("user_languages")
          .select("language")
          .eq("user_id", id);
        setLanguages(languagesData || []);

        // Fetch favorite games
        const { data: gamesData } = await supabase
          .from("user_favorite_games")
          .select("game_name")
          .eq("user_id", id);
        setFavoriteGames(gamesData || []);

        // Fetch liked genres
        const { data: likedGenresData } = await supabase
          .from("user_game_genres_liked")
          .select("genre")
          .eq("user_id", id);
        setLikedGenres(likedGenresData || []);

        // Fetch disliked genres
        const { data: dislikedGenresData } = await supabase
          .from("user_game_genres_disliked")
          .select("genre")
          .eq("user_id", id);
        setDislikedGenres(dislikedGenresData || []);

        // Fetch aesthetics
        const { data: aestheticsData } = await supabase
          .from("user_aesthetic_preferences")
          .select("aesthetic, preference")
          .eq("user_id", id);
        setAesthetics(aestheticsData || []);

        // Fetch user projects
        const { data: projectsData } = await supabase
          .from("project_members")
          .select(
            `
            project_id,
            projects (
              id,
              name,
              description,
              genre,
              image_url,
              status
            )
          `
          )
          .eq("user_id", id);

        if (projectsData) {
          const mappedProjects = projectsData
            .filter((pm: any) => pm.projects)
            .map((pm: any) => pm.projects);
          setProjects(mappedProjects);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o perfil.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Perfil não encontrado.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === id;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
        <ProfileSkills roles={roles} languages={languages} />
        <ProfileGames
          favoriteGames={favoriteGames}
          likedGenres={likedGenres}
          dislikedGenres={dislikedGenres}
          aesthetics={aesthetics}
        />
        <ProfileProjects projects={projects} />
      </div>
    </div>
  );
}

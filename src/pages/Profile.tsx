import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSkills } from "@/components/profile/ProfileSkills";
import { ProfileGames } from "@/components/profile/ProfileGames";
import { ProfileProjects } from "@/components/profile/ProfileProjects";
import { ProfilePortfolio } from "@/components/profile/ProfilePortfolio";
import { ProfileReviews } from "@/components/profile/ProfileReviews";
import { LeaveReviewDialog } from "@/components/profile/LeaveReviewDialog";
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
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [completedProjectsCount, setCompletedProjectsCount] = useState(0);
  const [sharedProjects, setSharedProjects] = useState<any[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
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
          
          // Count completed projects
          const completed = mappedProjects.filter(
            (p: any) => p.status === "concluido"
          ).length;
          setCompletedProjectsCount(completed);
        }

        // Fetch portfolio items
        const { data: portfolioData } = await supabase
          .from("user_portfolio_items")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false });
        setPortfolioItems(portfolioData || []);

        // Fetch reviews with reviewer details and project info
        const { data: reviewsData } = await supabase
          .from("user_reviews")
          .select(
            `
            id,
            rating,
            comment,
            created_at,
            reviewer:reviewer_id (
              id,
              full_name,
              username,
              avatar_url
            ),
            project:project_id (
              id,
              name
            )
          `
          )
          .eq("reviewed_id", id)
          .order("created_at", { ascending: false });

        if (reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData);
          const avgRating =
            reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) /
            reviewsData.length;
          setAverageRating(avgRating);
        }

        // If viewing someone else's profile, check for shared completed projects
        if (user && user.id !== id) {
          const { data: sharedProjectsData } = await supabase
            .from("project_members")
            .select(
              `
              project:project_id (
                id,
                name,
                status
              )
            `
            )
            .eq("user_id", user.id);

          const { data: theirProjectsData } = await supabase
            .from("project_members")
            .select("project_id")
            .eq("user_id", id);

          if (sharedProjectsData && theirProjectsData) {
            const theirProjectIds = theirProjectsData.map(
              (p: any) => p.project_id
            );
            const shared = sharedProjectsData
              .filter(
                (p: any) =>
                  p.project &&
                  p.project.status === "concluido" &&
                  theirProjectIds.includes(p.project.id)
              )
              .map((p: any) => p.project);
            setSharedProjects(shared);
          }
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Perfil não encontrado.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === id;

  const handleReloadProfile = () => {
    if (id) {
      // Trigger a reload by calling fetchProfile again
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          averageRating={averageRating}
          totalReviews={reviews.length}
          completedProjects={completedProjectsCount}
          onLeaveReview={
            !isOwnProfile && sharedProjects.length > 0
              ? () => setShowReviewDialog(true)
              : undefined
          }
        />
        <ProfileSkills roles={roles} languages={languages} />
        <ProfileGames
          favoriteGames={favoriteGames}
          likedGenres={likedGenres}
          dislikedGenres={dislikedGenres}
          aesthetics={aesthetics}
        />
        <ProfilePortfolio
          items={portfolioItems}
          isOwnProfile={isOwnProfile}
          onItemAdded={handleReloadProfile}
        />
        <ProfileReviews reviews={reviews} averageRating={averageRating} />
        <ProfileProjects projects={projects} />
      </div>

      {!isOwnProfile && sharedProjects.length > 0 && (
        <LeaveReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          reviewedUserId={id!}
          sharedProjects={sharedProjects}
          onReviewSubmitted={handleReloadProfile}
        />
      )}
    </div>
  );
}

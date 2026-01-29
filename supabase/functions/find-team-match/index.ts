import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Safe error messages (don't expose internal details)
const getSafeErrorMessage = (errorMsg: string): string => {
  if (errorMsg.includes("Rate limit")) {
    return "Limite de pedidos excedido. Tenta novamente mais tarde.";
  }
  if (errorMsg.includes("credits")) {
    return "Créditos de IA esgotados. Contacta o suporte.";
  }
  return "Erro interno. Por favor tenta novamente.";
};

// Calculate match score for a user
interface Review {
  reviewee_id: string;
  rating_overall: number;
  metrics: {
    deadlines?: number;
    quality?: number;
    communication?: number;
    teamwork?: number;
    professionalism?: number;
    problem_solving?: number;
  } | null;
  would_work_again: boolean | null;
  flags: {
    toxic?: boolean;
    abandoned?: boolean;
    broken_rules?: boolean;
  } | null;
}

function calculateMatchScore(
  userRoles: string[],
  userReviews: Review[],
  requiredSkills: string[]
): { total: number; avgRating: number; penalties: { toxic: boolean; abandoned: boolean } } {
  // Skill Match (40%)
  let skillScore = 0;
  if (requiredSkills.length > 0) {
    const matchedSkills = requiredSkills.filter(s => 
      userRoles.some(us => us.toLowerCase() === s.toLowerCase())
    );
    skillScore = (matchedSkills.length / requiredSkills.length) * 40;
  } else {
    skillScore = 20;
  }

  // Reputation (30%)
  const avgRating = userReviews.length > 0 
    ? userReviews.reduce((sum, r) => sum + r.rating_overall, 0) / userReviews.length
    : 3;
  const reputationScore = (avgRating / 5) * 30;

  // Reliability (20%)
  const deadlinesValues = userReviews
    .map(r => r.metrics?.deadlines)
    .filter((v): v is number => typeof v === 'number');
  const deadlinesAvg = deadlinesValues.length > 0 
    ? deadlinesValues.reduce((a, b) => a + b, 0) / deadlinesValues.length 
    : 3;
  const reliabilityScore = (deadlinesAvg / 5) * 20;

  // Compatibility (10%)
  const wouldWorkAgainCount = userReviews.filter(r => r.would_work_again === true).length;
  const compatibilityScore = userReviews.length > 0
    ? (wouldWorkAgainCount / userReviews.length) * 10
    : 5;

  // Penalties
  const hasToxicFlag = userReviews.some(r => r.flags?.toxic === true);
  const hasAbandonedFlag = userReviews.some(r => r.flags?.abandoned === true);
  
  let total = skillScore + reputationScore + reliabilityScore + compatibilityScore;
  
  if (hasToxicFlag) total -= 50;
  if (hasAbandonedFlag) total -= 30;

  return {
    total: Math.max(0, Math.min(100, total)),
    avgRating,
    penalties: { toxic: hasToxicFlag, abandoned: hasAbandonedFlag }
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { projectId, projectContext } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.log("User authentication failed");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, project_members(user_id)")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.log("Project not found:", projectId);
      return new Response(
        JSON.stringify({ error: "Projeto não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (project.owner_id !== user.id) {
      console.log("User is not project owner");
      return new Response(
        JSON.stringify({ error: "Apenas o dono do projeto pode encontrar matches" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const memberIds = project.project_members.map((m: { user_id: string }) => m.user_id);
    memberIds.push(project.owner_id); // Exclude owner too

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        username,
        full_name,
        country,
        bio,
        user_roles(role),
        user_languages(language),
        user_game_genres_liked(genre),
        user_game_genres_disliked(genre),
        user_aesthetic_preferences(aesthetic, preference),
        user_favorite_games(game_name)
      `)
      .not("id", "in", `(${memberIds.join(",")})`);

    if (profilesError) {
      console.error("Error fetching profiles");
      return new Response(
        JSON.stringify({ error: "Erro ao procurar developers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Não foram encontrados developers disponíveis" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Fetch reviews for all candidate users
    const profileIds = profiles.map(p => p.id);
    const { data: allReviews } = await supabase
      .from("reviews")
      .select("reviewee_id, rating_overall, metrics, would_work_again, flags")
      .in("reviewee_id", profileIds);

    // Group reviews by user
    const reviewsByUser = new Map<string, Review[]>();
    allReviews?.forEach(r => {
      const existing = reviewsByUser.get(r.reviewee_id) || [];
      existing.push(r as Review);
      reviewsByUser.set(r.reviewee_id, existing);
    });

    // Get required skills from project
    const requiredSkills = project.looking_for_roles || [];

    // Calculate scores and format profiles
    const formattedProfiles = profiles.map((profile) => {
      const userRoles = profile.user_roles?.map((r: { role: string }) => r.role) || [];
      const userReviews = reviewsByUser.get(profile.id) || [];
      const score = calculateMatchScore(userRoles, userReviews, requiredSkills);

      return {
        userId: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        country: profile.country,
        bio: profile.bio,
        roles: userRoles,
        languages: profile.user_languages?.map((l: { language: string }) => l.language) || [],
        likedGenres: profile.user_game_genres_liked?.map((g: { genre: string }) => g.genre) || [],
        dislikedGenres: profile.user_game_genres_disliked?.map((g: { genre: string }) => g.genre) || [],
        likedAesthetics: profile.user_aesthetic_preferences
          ?.filter((a: { preference: string }) => a.preference === "like")
          .map((a: { aesthetic: string }) => a.aesthetic) || [],
        dislikedAesthetics: profile.user_aesthetic_preferences
          ?.filter((a: { preference: string }) => a.preference === "dislike")
          .map((a: { aesthetic: string }) => a.aesthetic) || [],
        favoriteGames: profile.user_favorite_games?.map((g: { game_name: string }) => g.game_name) || [],
        matchScore: score.total,
        avgRating: score.avgRating,
        hasPenalties: score.penalties.toxic || score.penalties.abandoned,
      };
    });

    // Sort by match score (highest first)
    formattedProfiles.sort((a, b) => b.matchScore - a.matchScore);

    // Take top 10 candidates for AI analysis
    const topCandidates = formattedProfiles.slice(0, 10);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuração de IA em falta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Finding match for project: ${project.name}, analyzing ${topCandidates.length} top candidates`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI matchmaker for game development teams. Analyze the project context and developer profiles to find the best match. Consider:
- Skills needed vs developer roles (already pre-scored in matchScore)
- Genre preferences alignment
- Aesthetic preferences
- Experience with similar games
- Language compatibility
- Reputation score (avgRating) - prefer users with higher ratings
- Avoid users with hasPenalties flag (toxic/abandoned behavior)

The developers are pre-sorted by a weighted algorithm (skills 40%, reputation 30%, reliability 20%, compatibility 10%).

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "userId": "selected_user_id",
  "username": "username",
  "fullName": "full_name",
  "roles": ["role1", "role2"],
  "bio": "bio text",
  "avgRating": 4.5,
  "matchScore": 85,
  "reasoning": "2-3 sentences explaining why this is a good match"
}`,
          },
          {
            role: "user",
            content: `Project: ${project.name}
Genre: ${project.genre}
Description: ${project.description}
Looking for roles: ${requiredSkills.join(', ') || 'Any'}

Project Context: ${projectContext}

Top Candidates (sorted by match score):
${JSON.stringify(topCandidates, null, 2)}

Find the best match and return the JSON response. Prefer candidates with higher matchScore and avgRating, and avoid those with hasPenalties.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", aiResponse.status);
      return new Response(
        JSON.stringify({ error: "Erro no serviço de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    const match = JSON.parse(content);
    console.log(`Match found: ${match.username} with score ${match.matchScore}`);

    return new Response(JSON.stringify(match), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";
    console.error("Unexpected error in find-team-match:", error);
    return new Response(
      JSON.stringify({ error: getSafeErrorMessage(errorMessage) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

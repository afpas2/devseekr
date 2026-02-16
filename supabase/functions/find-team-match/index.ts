import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getSafeErrorMessage = (errorMsg: string): string => {
  if (errorMsg.includes("Rate limit")) return "Limite de pedidos excedido. Tenta novamente mais tarde.";
  if (errorMsg.includes("credits")) return "Créditos de IA esgotados. Contacta o suporte.";
  return "Erro interno. Por favor tenta novamente.";
};

interface Review {
  reviewee_id: string;
  rating_overall: number;
  metrics: { deadlines?: number; quality?: number; communication?: number; teamwork?: number; professionalism?: number; problem_solving?: number } | null;
  would_work_again: boolean | null;
  flags: { toxic?: boolean; abandoned?: boolean; broken_rules?: boolean } | null;
}

function calculateMatchScore(
  userRoles: string[], userReviews: Review[], requiredSkills: string[]
): { total: number; avgRating: number; penalties: { toxic: boolean; abandoned: boolean } } {
  let skillScore = 0;
  if (requiredSkills.length > 0) {
    const matchedSkills = requiredSkills.filter(s => userRoles.some(us => us.toLowerCase() === s.toLowerCase()));
    skillScore = (matchedSkills.length / requiredSkills.length) * 40;
  } else {
    skillScore = 20;
  }

  const avgRating = userReviews.length > 0 
    ? userReviews.reduce((sum, r) => sum + r.rating_overall, 0) / userReviews.length : 3;
  const reputationScore = (avgRating / 5) * 30;

  const deadlinesValues = userReviews.map(r => r.metrics?.deadlines).filter((v): v is number => typeof v === 'number');
  const deadlinesAvg = deadlinesValues.length > 0 ? deadlinesValues.reduce((a, b) => a + b, 0) / deadlinesValues.length : 3;
  const reliabilityScore = (deadlinesAvg / 5) * 20;

  const wouldWorkAgainCount = userReviews.filter(r => r.would_work_again === true).length;
  const compatibilityScore = userReviews.length > 0 ? (wouldWorkAgainCount / userReviews.length) * 10 : 5;

  const hasToxicFlag = userReviews.some(r => r.flags?.toxic === true);
  const hasAbandonedFlag = userReviews.some(r => r.flags?.abandoned === true);
  
  let total = skillScore + reputationScore + reliabilityScore + compatibilityScore;
  if (hasToxicFlag) total -= 50;
  if (hasAbandonedFlag) total -= 30;

  return { total: Math.max(0, Math.min(100, total)), avgRating, penalties: { toxic: hasToxicFlag, abandoned: hasAbandonedFlag } };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { projectId, projectContext } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: project, error: projectError } = await supabase
      .from("projects").select("*, project_members(user_id)").eq("id", projectId).single();

    if (projectError) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (project.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Apenas o dono do projeto pode encontrar matches" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const memberIds = project.project_members.map((m: { user_id: string }) => m.user_id);
    memberIds.push(project.owner_id);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`id, username, full_name, country, bio, user_roles(role), user_languages(language), user_game_genres_liked(genre), user_game_genres_disliked(genre), user_aesthetic_preferences(aesthetic, preference), user_favorite_games(game_name)`)
      .not("id", "in", `(${memberIds.join(",")})`);

    if (profilesError || !profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: "Não foram encontrados developers disponíveis" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch reviews
    const profileIds = profiles.map(p => p.id);
    const { data: allReviews } = await supabase.from("reviews").select("reviewee_id, rating_overall, metrics, would_work_again, flags").in("reviewee_id", profileIds);

    const reviewsByUser = new Map<string, Review[]>();
    allReviews?.forEach(r => {
      const existing = reviewsByUser.get(r.reviewee_id) || [];
      existing.push(r as Review);
      reviewsByUser.set(r.reviewee_id, existing);
    });

    // Fetch completed projects for all candidates
    const { data: completedMemberships } = await supabase
      .from("project_members")
      .select("user_id, project_id, projects(name, status)")
      .in("user_id", profileIds);

    const { data: ownedProjects } = await supabase
      .from("projects")
      .select("owner_id, name, status")
      .in("owner_id", profileIds);

    const completedProjectsByUser = new Map<string, string[]>();
    completedMemberships?.forEach((m: any) => {
      if (m.projects?.status === "concluido" || m.projects?.status === "completed") {
        const existing = completedProjectsByUser.get(m.user_id) || [];
        if (m.projects?.name) existing.push(m.projects.name);
        completedProjectsByUser.set(m.user_id, existing);
      }
    });
    ownedProjects?.forEach((p: any) => {
      if (p.status === "concluido" || p.status === "completed") {
        const existing = completedProjectsByUser.get(p.owner_id) || [];
        if (p.name) existing.push(p.name);
        completedProjectsByUser.set(p.owner_id, existing);
      }
    });

    const requiredSkills = project.looking_for_roles || [];

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
        likedAesthetics: profile.user_aesthetic_preferences?.filter((a: { preference: string }) => a.preference === "like").map((a: { aesthetic: string }) => a.aesthetic) || [],
        dislikedAesthetics: profile.user_aesthetic_preferences?.filter((a: { preference: string }) => a.preference === "dislike").map((a: { aesthetic: string }) => a.aesthetic) || [],
        favoriteGames: profile.user_favorite_games?.map((g: { game_name: string }) => g.game_name) || [],
        matchScore: score.total,
        avgRating: score.avgRating,
        hasPenalties: score.penalties.toxic || score.penalties.abandoned,
        completedProjects: completedProjectsByUser.get(profile.id) || [],
      };
    });

    formattedProfiles.sort((a, b) => b.matchScore - a.matchScore);
    const topCandidates = formattedProfiles.slice(0, 10);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Configuração de IA em falta" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Finding top 3 matches for project: ${project.name}, analyzing ${topCandidates.length} candidates`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI matchmaker for game development teams. Analyze the project context and developer profiles to find the TOP 3 best matches. Consider:
- Skills needed vs developer roles (pre-scored in matchScore)
- Genre preferences alignment
- Aesthetic preferences
- Experience with similar games
- Language compatibility
- Reputation score (avgRating) - prefer higher ratings
- Avoid users with hasPenalties flag
- completedProjects shows their track record

Return ONLY a JSON array of exactly 3 objects (no markdown, no extra text):
[
  {
    "userId": "id",
    "username": "username",
    "fullName": "full_name",
    "roles": ["role1", "role2"],
    "bio": "bio text",
    "avgRating": 4.5,
    "matchScore": 85,
    "reasoning": "2-3 sentences explaining why this is a good match",
    "highlight": "Short badge phrase like 'Unity Veteran' or 'Excellent Communicator'",
    "completedProjects": ["Project A", "Project B"]
  }
]

If fewer than 3 candidates are available, return as many as possible. Each candidate MUST be from the provided list.`,
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

Find the TOP 3 best matches and return the JSON array.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente mais tarde." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      console.error("AI gateway error:", aiResponse.status);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse - handle potential markdown wrapping
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    
    const matches = JSON.parse(cleanContent);
    console.log(`Found ${Array.isArray(matches) ? matches.length : 1} matches`);

    return new Response(JSON.stringify(matches), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";
    console.error("Unexpected error in find-team-match:", error);
    return new Response(JSON.stringify({ error: getSafeErrorMessage(errorMessage) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

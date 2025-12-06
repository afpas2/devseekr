import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapa de erros seguros (não expõe detalhes internos)
const getSafeErrorMessage = (errorMsg: string): string => {
  if (errorMsg.includes("Rate limit")) {
    return "Limite de pedidos excedido. Tenta novamente mais tarde.";
  }
  if (errorMsg.includes("credits")) {
    return "Créditos de IA esgotados. Contacta o suporte.";
  }
  return "Erro interno. Por favor tenta novamente.";
};

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

    const memberIds = project.project_members.map((m: any) => m.user_id);

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

    const formattedProfiles = profiles.map((profile) => ({
      userId: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      country: profile.country,
      bio: profile.bio,
      roles: profile.user_roles?.map((r: any) => r.role) || [],
      languages: profile.user_languages?.map((l: any) => l.language) || [],
      likedGenres: profile.user_game_genres_liked?.map((g: any) => g.genre) || [],
      dislikedGenres: profile.user_game_genres_disliked?.map((g: any) => g.genre) || [],
      likedAesthetics: profile.user_aesthetic_preferences
        ?.filter((a: any) => a.preference === "like")
        .map((a: any) => a.aesthetic) || [],
      dislikedAesthetics: profile.user_aesthetic_preferences
        ?.filter((a: any) => a.preference === "dislike")
        .map((a: any) => a.aesthetic) || [],
      favoriteGames: profile.user_favorite_games?.map((g: any) => g.game_name) || [],
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuração de IA em falta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Finding match for project: ${project.name}`);

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
- Skills needed vs developer roles
- Genre preferences alignment
- Aesthetic preferences
- Experience with similar games
- Language compatibility

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "userId": "selected_user_id",
  "username": "username",
  "fullName": "full_name",
  "roles": ["role1", "role2"],
  "bio": "bio text",
  "reasoning": "2-3 sentences explaining why this is a good match"
}`,
          },
          {
            role: "user",
            content: `Project: ${project.name}
Genre: ${project.genre}
Description: ${project.description}

Project Context: ${projectContext}

Available Developers:
${JSON.stringify(formattedProfiles, null, 2)}

Find the best match and return the JSON response.`,
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
    console.log(`Match found: ${match.username}`);

    return new Response(JSON.stringify(match), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Unexpected error in find-team-match:", error);
    return new Response(
      JSON.stringify({ error: getSafeErrorMessage(error.message || "") }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
